import {
  Controller,
  Post,
  Body,
  Headers,
  Res,
  Req,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  Get,
  UnauthorizedException,
  Header,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto, LoginDto } from './dto/create-auth.dto';

import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/role.enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { sendAuthResponse, clearAuthCookies } from 'src/common/utils/send-auth-response.util';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { passwordDto, updatePasswordDto } from './dto/password-auth.dto';
import { CustomHttpResponse } from 'src/utils/custom-http-response';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'profile_image', maxCount: 1 }]))
  register(@Body() createAuthDto: CreateAuthDto, @UploadedFiles() files: { profile_image?: Express.Multer.File; }) {
    return this.authService.register(createAuthDto, files.profile_image?.[0]);
  }

  @Post('/login')
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    
    // For web clients, set cookies and return user data
    if (clientType === 'web') {
      response.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
        path: '/',
      });

      response.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/auth/refresh',
      });

      const userData = result.user ? (() => {
        const { password, ...userWithoutPassword } = result.user;
        return userWithoutPassword;
      })() : null;

      return new CustomHttpResponse({
        message: 'Authentication successful',
        data: { user: userData },
        error: null,
        statusCode: 200
      });
    }
    
    // For mobile clients, return tokens in response body
    return new CustomHttpResponse({
      message: 'Authentication successful',
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user
      },
      error: null,
      statusCode: 200
    });
  }

  @Post('/send-otp')
  sendOtp(@Body() dto: { phone?: string, email?: string }) {
    return this.authService.sendOtp(dto.phone, dto.email);
  }

  @Post('/verify-otp')
  async verifyOtp(
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) response: Response,
    @Body() dto: { code: string, phone?: string, email?: string }
  ) {
    const result = await this.authService.verifyOtp(dto.code, dto.phone, dto.email);
    return sendAuthResponse(response, clientType, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, result.user);
  }

  @Post('/refresh')
  async refresh(
    @Headers('x-client-type') clientType: string,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
    @Body() dto: { refreshToken?: string },
  ) {
    const token = clientType === 'web' ? req.cookies?.refreshToken : dto.refreshToken;

    const result = await this.authService.refreshTokens(token);

    return sendAuthResponse(response, clientType, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, result.user);
  }

  @Post('/forget-password')
  forgetPassword(@Body() dto:passwordDto ) {
    return this.authService.forgotPassword(dto.email,dto.newPassword,dto.confirmPassword);
  }

  @Post('/update-password')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  updatePassword(@Body() dto: updatePasswordDto) {
    return this.authService.updatePassword(dto.userId, dto.currentPassword, dto.newPassword, dto.confirmPassword);
  }

  @Post('/logout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.STAFF,
    UserRole.ADMIN,
  )
  logout(
    @Body() body: { sessionId: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    clearAuthCookies(response);
    return this.authService.logout(body.sessionId);
  }

  @Post('validate-token')
  async validateToken(@Body() body: { token: string }) {
    try {
      // Verify the token using the JWT service
      const decoded = await this.authService.verifyToken(body.token);
      
      // Get user details
      const user = await this.authService.getUserById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid user');
      }

      // Return user info without password
      const { password, ...userWithoutPassword } = user;
      return {
        valid: true,
        user: userWithoutPassword,
        expiresIn: decoded.exp ? new Date(decoded.exp * 1000) : null
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }


  @Get('validate')
  @Header('Content-Type', 'application/json')
  async validateAuthHeader(
    @Headers('authorization') authHeader: string,
    @Res() response: Response
  ) {
    console.log("req recieved to validate token")
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      response.status(401).send({ statusCode: 401, message: 'Invalid authorization header' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = await this.authService.verifyToken(token);
      const user = await this.authService.getUserById(decoded.sub);
      
      if (!user) {
        response.status(401).send({ statusCode: 401, message: 'User not found' });
        return;
      }

      // Set headers for Spring Cloud Gateway
      response.setHeader('X-User-Id', user.id.toString());
      response.setHeader('X-User-Roles', user.role);
      
      // Return empty 200 OK with just the headers
      response.status(200).send();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  @Post('/logout-all')
  @UseGuards(AuthGuard('jwt'),RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
  )
  logoutAll(
    @Body() body: { userId: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    clearAuthCookies(response);
    return this.authService.logoutAll(body.userId);
  }
}
