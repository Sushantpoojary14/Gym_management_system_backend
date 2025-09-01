import { HttpService } from '@nestjs/axios';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async validateToken(token: string) {
    try {
      const user = await firstValueFrom(
        this.httpService.post(
          `${process.env.AUTH_BACKEND_URL}/auth/validate-token`,
          {
            token,
          },
          {
            headers: {
              content_type: 'application/json',
            },
          },
        ),
      );
      const data = user.data;
      if (!data?.valid || !data?.user?.id) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      return data.user;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
  async getUser(userId: string) {
    const userKey = 'user_' + userId;

    let user: any = await this.cacheManager.get(userKey);
    if (user) {
      return JSON.parse(user);
    }

    const token = this.jwtService.sign(
      { sub: userId },
      { secret: process.env.JWT_SECRET, expiresIn: '1h' },
    );

    const data = await firstValueFrom(
      this.httpService.get(`${process.env.AUTH_BACKEND_URL}/user`, {
        headers: {
          content_type: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }),
    );

    user = data?.data?.user;
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    await this.cacheManager.set(userKey, JSON.stringify(user), 60 * 60 * 24);
    return user;
  }
}
