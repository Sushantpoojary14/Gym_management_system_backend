import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/modules/user/user.service';
import { JwtPayload } from 'src/types/jwt-payload.interface';
import { Request } from 'express';
import { ConfigModule } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req:Request)=>{
          //For web
          if (req.cookies && req.cookies['accessToken']) {
            return req.cookies['accessToken'];
          }
          //For mobile
          if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')
          ) {
            return req.headers.authorization.split(' ')[1];
          }

          return null;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }
}
