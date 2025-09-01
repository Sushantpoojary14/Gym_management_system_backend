import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { SessionService } from '../session/session.service';
import { User } from '../user/entities/user.entity';
import { Redis } from 'ioredis';
import { sendMail } from 'src/common/utils/nodemailer.util';
import axios from 'axios';
import { CreateAuthDto } from './dto/create-auth.dto';
import { generateReferralCode } from 'src/common/utils/referral-code.util';
import { ReferralService } from '../referral/referral.service';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/common/enums/role.enum';
import { Gender } from 'src/common/enums/gender.enum';
import { AwsS3Service } from '../aws-s3/aws-s3.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionService: SessionService,
    private readonly referralService: ReferralService,
    private awsService: AwsS3Service,
    private readonly jwtService: JwtService,
    private jwt: JwtService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  //user register
  public async register(dto: CreateAuthDto,profileFile?: Express.Multer.File): Promise<User> {
    try {
      if(Boolean(dto.is18) == false){
        throw new BadRequestException('You must be 18 years or older to register');
      }
      
      const existingUser = await this.usersService.findByEmailOrPhone(dto.email, dto.phone);
      if (existingUser) {
        if (existingUser.email === dto.email) {
          throw new BadRequestException('Email already in use');
        }
        if (existingUser.phone === dto.phone) {
          throw new BadRequestException('Phone number already in use');
        }
      }

      let referrer;
      if (dto.referralCode) {
        referrer = await this.referralService.findByCode(dto.referralCode);
        if (!referrer) {
          throw new BadRequestException('Invalid referral code');
        }
      }

      let profileUrl = '';
      if (profileFile) {
        profileUrl = await this.awsService.uploadFile(profileFile, 'users/profiles');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const userData = { ...dto, password: hashedPassword,profileUrl };

      const newUser = await this.usersService.create(userData);
      const referralCode = await this.generateUniqueReferralCode();
      await this.referralService.createReferral(newUser.id, referralCode);

      if (referrer) {
        await this.referralService.incrementBoth(referrer.userId, newUser.id, 50, 50);
      }

      return newUser;
    } catch (error) {
      throw new InternalServerErrorException(error.message??'User registration failed');
    }
  }

  private async generateUniqueReferralCode(): Promise<string> {
    let code = '';
    let exists = true;

    while (exists) {
      code = generateReferralCode();
      exists = !!(await this.referralService.findByCode(code));
    }

    return code;
  }

  //admin register & login
  public async login(email: string, password: string): Promise<{ isVerified: boolean; accessToken: string; refreshToken: string, user?: User }> {
    try {
      // Check if user exists - include password for login verification
      let user = await this.usersService.findByEmail(email, true);

      if (user) {
        // Skip email verification check for super admins
        if (!user.isVerified && user.role !== UserRole.SUPER_ADMIN) {
          return { isVerified: false, accessToken: '', refreshToken: '' };
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          throw new UnauthorizedException('Invalid email or password');
        }
      } else {
        // First-time admin creation
        const existingAdmin = await this.usersService.findOne('role', UserRole.SUPER_ADMIN);
        if (existingAdmin) {
          throw new BadRequestException('Admin already exists');
        }
        
        // Create admin with proper fields
        user = await this.register({
          email,
          password: password, // Will be hashed in register method
          fullName: 'Super Admin',
          phone: '0000000000',
          role: UserRole.SUPER_ADMIN,
          gender: Gender.OTHER,
          dateOfBirth: new Date('1990-01-01'),
          profileUrl: '',
          referralCode: '',
          is18: 'true', // Must be string literal "true"
          isVerified: true // Auto-verify admin
        });
      }

      // Update last seen and generate tokens
      await this.usersService.update(user.id, { lastSeen: new Date() });
      const tokens = await this.createTokens(user);
      
      return {
        ...tokens,
        isVerified: user.isVerified,
        user: user
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(error.message??'Login failed');
    }
  }

  //user send otp
  public async sendOtp(phone?: string, email?: string): Promise<{ message: string , statusCode: number,code?: string}> {
    try {
      let user: User | null = null;

      if (email) user = await this.usersService.findByEmail(email);
      else if (phone) user = await this.usersService.findByPhone(phone);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const key = phone ? `otp:phone:${phone}` : `otp:email:${email}`;
      const sendKey = phone ? `otp:send:${phone}` : `otp:send:${email}`;

      //Rate limit check for sending (5 per hour)
      const sendAttempts = await this.redisClient.incr(sendKey);
      if (sendAttempts === 1) {
        await this.redisClient.expire(sendKey, 3600); // 1 hour
      }
      if (sendAttempts > 5) {
        throw new BadRequestException(
          'Too many OTP requests. Try again later.',
        );
      }

      await this.redisClient.set(key, otp, 'EX', 300);// 5 minutes

      if (email) {
        const success = await sendMail({
          from: process.env.EMAIL_SENDER,
          to: email,
          subject: 'Your OTP Code',
          html: `<h2>Your OTP is: ${otp}</h2><p>This OTP will expire in 5 minutes.</p>`,
        });
        if (!success)
          throw new InternalServerErrorException('Failed to send OTP email');
      } else if (phone) {
        const response = await axios.post(
          'https://www.fast2sms.com/dev/bulkV2',
          {
            variables_values: otp,
            route: 'otp',
            numbers: phone,
          },
          {
            headers: {
              authorization: process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.data.return) {
          throw new InternalServerErrorException('Failed to send OTP SMS');
        }
        console.log(`SMS OTP sent to ${phone}: ${otp}`);
      }

      return {
        message: 'OTP sent successfully',
        statusCode: 200,
        code:process.env.NODE_ENV==='development'?otp:undefined
      };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(error.message || 'OTP sending failed');
    }
  }

  //user verify otp & login
  public async verifyOtp(
    code: string,
    phone?: string,
    email?: string,
  ): Promise<{ accessToken: string; refreshToken: string, user?: User }> {
    try {
      let user: User | null = null;

      if (email) user = await this.usersService.findByEmail(email);
      else if (phone) user = await this.usersService.findByPhone(phone);

      if (!user) throw new BadRequestException('User not found');

      const key = phone ? `otp:phone:${phone}` : `otp:email:${email}`;
      const tryKey = phone ? `otp:try:${phone}` : `otp:try:${email}`;
      const sendKey = phone ? `otp:send:${phone}` : `otp:send:${email}`;

      const storedOtp = await this.redisClient.get(key);
      if (!storedOtp) {
        throw new BadRequestException('OTP expired or not found');
      }

      const attempts = await this.redisClient.incr(tryKey);
      if (attempts === 1) {
        await this.redisClient.expire(tryKey, 60);// 1 minute
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

      await this.usersService.update(user.id, { isVerified: true, lastSeen: new Date() });
      const { accessToken, refreshToken } = await this.createTokens(user);
      return { accessToken, refreshToken, user };
    } catch (error) {
      throw error instanceof HttpException
        ? error
        : new InternalServerErrorException(error.message ?? 'OTP verification failed');
    }
  }

  public async createTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.jwt.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN,
      },
    );

    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; 

    // Create session with hashed placeholder first
    const placeholder = process.env.PLACEHOLDER??"placeholder";
    const session = await this.sessionService.createSession(
      user.id,
      placeholder,
      expiresAt,
    );

    const refreshPayload = { sub: user.id, sid: session.id };
    const refreshToken = this.jwt.sign(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.REFRESH_EXPIRES_IN,
    });

    // Hash and store actual refresh token
    session.refreshToken = await bcrypt.hash(refreshToken, 10);
    await this.sessionService.updateSession(session.id, session);

    return { accessToken, refreshToken };
  }

  public async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string, user?: User }> {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.REFRESH_SECRET });
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const { sub: userId, sid: sessionId } = payload;

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

    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');
    const tokens = await this.createTokens(user);
    return { ...tokens, user };
  }

  private async passwordHelper(user: any, newPassword: string, confirmPassword: string): Promise<any> {
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
    const data=await this.usersService.update(user.id, { password: hashedPassword });

    return data
  }

  public async forgotPassword(email: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isVerified) {
      throw new BadRequestException('User is not verified');
    }

    return this.passwordHelper(user, newPassword, confirmPassword);
  }

  public async updatePassword(userId: number,currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findUserById(userId);
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (!await bcrypt.compare(currentPassword, user.password)) {
        throw new BadRequestException('Current password is incorrect');
      }

      return this.passwordHelper(user, newPassword, confirmPassword);
    } catch (error) {
      if(error instanceof BadRequestException){
        throw error
      }
      throw new InternalServerErrorException(error.message ?? 'Error updating password');
    }
  }

  public async logout(sessionId: number) {
    const result = await this.sessionService.revokeSession(sessionId);
    if (!result)
      throw new BadRequestException('Session not found or already revoked');
    return { message: 'Logged out successfully' };
  }

  public async logoutAll(userId: number) {
    await this.sessionService.revokeAllSessions(userId);
    return { message: 'Logged out from all devices' };
  }

  async verifyToken(token: string) {
    try {
      return await this.jwt.verify(token, { secret: process.env.JWT_SECRET });
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  
  async getUserById(userId: number) {
    return this.usersService.findUserById(userId);
  }
}
