import { ForbiddenException, Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User, UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private eventsService: EventsService,
  ) {}

  private readonly SALT_ROUNDS = 10;
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  async register(registerDto: RegisterDto) {
    const { email, password, ...rest } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...rest,
        email,
        password: hashedPassword,
      },
    });

    // Emit user registered event
    await this.eventsService.emitUserRegistered(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Return user data (excluding password) and tokens
    const { password: _, ...result } = user;
    return {
      ...result,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Emit user logged in event
    await this.eventsService.emitUserLoggedIn(
      user,
      loginDto.ipAddress || 'unknown',
      loginDto.userAgent || 'unknown',
    );

    // Return user data (excluding password) and tokens
    const { password: _, ...result } = user;
    return {
      ...result,
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;

    // Find refresh token in database
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenData || new Date() > tokenData.expiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(tokenData.user);

    // Return new tokens
    return tokens;
  }

  async logout(userId: string, refreshTokenDto: RefreshTokenDto) {
    // Emit user logged out event before deleting the token
    await this.eventsService.emitUserLoggedOut(
      userId,
      refreshTokenDto.token,
    );

    // Delete the refresh token
    await this.prisma.refreshToken.delete({
      where: { token: refreshTokenDto.token },
    });
  }

  private async generateTokens(user: User) {
    // Create JWT payload
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });

    // Generate refresh token
    const refreshToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    // Save refresh token to database
    await this.prisma.refreshToken.upsert({
      where: { userId: user.id },
      update: { token: refreshToken, expiresAt },
      create: {
        token: refreshToken,
        expiresAt,
        user: { connect: { id: user.id } },
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
  }
}