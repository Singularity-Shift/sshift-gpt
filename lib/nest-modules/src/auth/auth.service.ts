import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { validateSignature } from '@aptos';
import { PayloadDto } from './dto/payload.dto';
import { LoginDto } from './dto/login.dto';
import { Chain } from '@helpers';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  isValid(payload: PayloadDto): boolean {
    return validateSignature(payload);
  }

  async sigIn(address: string, chain: Chain): Promise<LoginDto> {
    const authToken = await this.jwtService.signAsync({
      address,
      chain,
    });

    return {
      authToken,
    };
  }
}
