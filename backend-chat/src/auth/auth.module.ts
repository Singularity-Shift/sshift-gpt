import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigService } from '../share/config/config.service';
import { ConfigModule } from '../share/config/config.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule, UserModule],
      useFactory: (configService: ConfigService) => {
        return {
          global: true,
          secret: configService.get('jwt.secret'),
          signOptions: { expiresIn: configService.get('jwt.expiredTime') },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
