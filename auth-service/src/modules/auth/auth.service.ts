import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';

import * as bcrypt from 'bcrypt';
import { SessionService } from './session.service';

import { Redis } from 'ioredis';

import { CreateAuthDto, CreateAuthSchema } from './dto/create-auth.dto';

import { JwtService } from '@nestjs/jwt';

import { AwsS3Service } from '../aws-s3/aws-s3.service';
import { PrismaService } from 'src/database/prisma.service';
import { User, UserStatus } from '@prisma/client';

import z from 'zod';
import { CustomHttpResponse } from 'src/utils/custom-http-response';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sessionService: SessionService,
    private awsService: AwsS3Service,
    private jwt: JwtService,

    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  //user register
  public async register(
    dto: CreateAuthDto,
    profileFile?: Express.Multer.File,
  ): Promise<{ message: string; data: { email: string } }> {
    this.logger.log(`Registering user: ${dto.email}`);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { phoneNumber: dto.phoneNumber }],
      },
    });
    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new BadRequestException('Email already in use');
      }
      if (existingUser.phoneNumber === dto.phoneNumber) {
        throw new BadRequestException('Phone number already in use');
      }
    }

    let profileUrl = '';
    if (profileFile) {
      profileUrl = await this.awsService.uploadFile(
        profileFile,
        'users/profiles',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const key = `register:${dto.email}`;
    const otpKey = dto.email
      ? `otp:email:${dto.email}`
      : `otp:phone:${dto.phoneNumber}`;
    const sendKey = dto.email
      ? `otp:send:${dto.email}`
      : `otp:send:${dto.phoneNumber}`;
    await Promise.all([
      this.redisClient.del(otpKey),
      this.redisClient.del(sendKey),
    ]);
    this.logger.log(`Registering user: ${otpKey}`);
    const value = {
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      dateOfBirth: dto.dateOfBirth,
      profileUrl: profileUrl,
      password: hashedPassword,
      gender: dto.gender,
    };
    await this.redisClient.set(key, JSON.stringify(value), 'EX', 300);
    await this.sendOtp(dto.email);

    return {
      message: 'otp sent successfully',
      data: {
        email: dto.email,
      },
    };
  }

  //admin register & login
  public async login(
    email: z.infer<typeof CreateAuthSchema>['email'],
    password: string,
  ): Promise<{
    isVerified: boolean;
    accessToken: string;
    refreshToken: string;
    user?: User;
  }> {
    let user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last seen and generate tokens
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLogin: new Date(),
      },
    });

    const tokens = await this.createTokens(user);

    return {
      ...tokens,
      isVerified: user.isVerified,
      user: user,
    };
  }

  async verifyRegistrationOtp(
    otp: string,
    email?: string,
    phone?: string,
  ): Promise<{
    data: {
      user?: User;
      accessToken: string;
      refreshToken: string;
    };
    message: string;
    statusCode: number;
  }> {
    const key = `register:${email}`;

    const user = await this.redisClient.get(key);
  
    if (!user) {
      throw new BadRequestException('User not found or OTP expired');
    }
    const dto = JSON.parse(user);
    const { valid } = await this.verifyOtp(otp, email);

    if (!valid) {
      await this.redisClient.del(key);
      const isProfileUrl = dto.profileUrl.includes('s3');
      if (isProfileUrl) {
        await this.awsService.deleteFile(dto.profileUrl.split('.com/')[1]);
      } else {
        await this.awsService.deleteFile(dto.profileUrl, true);
      }
      throw new BadRequestException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        dateOfBirth: dto.dateOfBirth,
        password: hashedPassword,
        gender: dto.gender,
        profileUrl: dto.profileUrl,
        isVerified: true,
        status: UserStatus.ACTIVE,
        lastLogin: new Date(),
      },
    });

    const { accessToken, refreshToken } = await this.createTokens(newUser);
    await this.redisClient.del(key);
    return {
      data: { accessToken, refreshToken },
      message: 'User registered successfully',
      statusCode: 201,
    };
  }
  //user send otp
  public async sendOtp(
    email?: string,
    phone?: string,
  ): Promise<{ message: string; statusCode: number; code?: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const key = phone ? `otp:phone:${phone}` : `otp:email:${email}`;
    const sendKey = phone ? `otp:send:${phone}` : `otp:send:${email}`;
    console.log(otp, sendKey);
    //Rate limit check for sending (5 per hour)
    const sendAttempts = await this.redisClient.incr(sendKey);
    if (sendAttempts === 1) {
      await this.redisClient.expire(sendKey, 3600); // 1 hour
    }
    if (sendAttempts > 5) {
      throw new BadRequestException('Too many OTP requests. Try again later.');
    }

    await this.redisClient.set(key, otp, 'EX', 300); // 5 minutes

    if (email) {
      // const success = await sendMail({
      //   from: process.env.EMAIL_SENDER,
      //   to: email,
      //   subject: 'Your OTP Code',
      //   html: `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 5 minutes.</p>`,
      // });
      // if (!success)
      //   throw new InternalServerErrorException('Failed to send OTP email');
    } else if (phone) {
      // const response = await axios.post(
      //   'https://www.fast2sms.com/dev/bulkV2',
      //   {
      //     variables_values: otp,
      //     route: 'otp',
      //     numbers: phone,
      //   },
      //   {
      //     headers: {
      //       authorization: process.env.FAST2SMS_API_KEY,
      //       'Content-Type': 'application/json',
      //     },
      //   },
      // );
      // if (!response.data.return) {
      //   throw new InternalServerErrorException('Failed to send OTP SMS');
      // }
      // console.log(`SMS OTP sent to ${phone}: ${otp}`);
    }

    return {
      message: 'OTP sent successfully',
      statusCode: 200,
      code: process.env.NODE_ENV === 'development' ? otp : undefined,
    };
  }

  //user verify otp & login
  public async verifyOtp(
    code: string,
    email?: CreateAuthDto['email'],
    phone?: CreateAuthDto['phoneNumber'],
  ): Promise<{ valid: boolean; message: string }> {
    const key = phone ? `otp:phone:${phone}` : `otp:email:${email}`;
    const tryKey = phone ? `otp:try:${phone}` : `otp:try:${email}`;
    const sendKey = phone ? `otp:send:${phone}` : `otp:send:${email}`;

    const storedOtp = await this.redisClient.get(key);
    console.log(key, code);
    if (!storedOtp) {
      throw new BadRequestException('OTP expired or not found');
    }

    const attempts = await this.redisClient.incr(tryKey);
    if (attempts === 1) {
      await this.redisClient.expire(tryKey, 60); // 1 minute
    }
    if (attempts > 3) {
      throw new BadRequestException('Too many incorrect OTP attempts');
    }

    if (storedOtp !== code) {
      throw new UnauthorizedException('Invalid OTP');
    }

    await Promise.all([
      this.redisClient.del(key),
      this.redisClient.del(tryKey),
      this.redisClient.del(sendKey),
    ]);

    return {
      valid: true,
      message: 'OTP verified successfully',
    };
  }

  public async createTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwt.sign(
      { id: user.id, role: user.role },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
      },
    );

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    // Create session with hashed placeholder first
    const placeholder = process.env.PLACEHOLDER ?? 'placeholder';
    const session = await this.sessionService.createSession(
      user.id,
      placeholder,
      expiresAt,
    );

    const refreshPayload = { id: user.id, sid: session.id };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });

    // Hash and store actual refresh token
    session.token = await bcrypt.hash(refreshToken, 10);
    await this.sessionService.updateSession(session.id, session);

    return { accessToken, refreshToken };
  }

  public async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string; user?: User }> {
    let payload: any;

    payload = this.jwt.verify(refreshToken, {
      secret: process.env.JWT_REFRESH_SECRET,
    });

    const { id: userId, sid: sessionId } = payload;

    const session = await this.sessionService.findValidSession(
      userId,
      sessionId,
      refreshToken,
    );
    if (!session) {
      await this.sessionService.revokeAllSessions(userId);
      throw new UnauthorizedException(
        'Invalid or reused refresh token. All sessions revoked.',
      );
    }

    await this.sessionService.revokeSession(session.id);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    const tokens = await this.createTokens(user);
    return { ...tokens, user };
  }

  private async passwordHelper(
    user: any,
    newPassword: string,
    confirmPassword: string,
  ): Promise<any> {
    if (newPassword.trim() === '' || confirmPassword.trim() === '') {
      throw new BadRequestException('Password cannot be empty');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (newPassword.length > 15) {
      throw new BadRequestException('Password is too long (max 15 characters)');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const data = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return data;
  }

  public async forgotPassword(
    email: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isVerified) {
      throw new BadRequestException('User is not verified');
    }

    return this.passwordHelper(user, newPassword, confirmPassword);
  }

  public async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!(await bcrypt.compare(currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }

    return this.passwordHelper(user, newPassword, confirmPassword);
  }

  public async logout(sessionId: string) {
    const result = await this.sessionService.revokeSession(sessionId);
    if (!result)
      throw new BadRequestException('Session not found or already revoked');
    return { message: 'Logged out successfully' };
  }

  public async logoutAll(userId: string) {
    await this.sessionService.revokeAllSessions(userId);
    return { message: 'Logged out from all devices' };
  }

  async verifyToken(token: string) {
    return await this.jwt.verify(token, { secret: process.env.JWT_SECRET });
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({ where: { id: userId } });
  }
}
