import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { PayloadDto } from './dto/payload.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    description: 'Login with aptos account',
    summary: 'Public',
  })
  @ApiResponse({
    status: 201,
    description: 'The jwt token generated',
    type: LoginDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access',
  })
  signIn(@Body() payloadDto: PayloadDto) {
    const isValid = this.authService.isValid(payloadDto);

    if (!isValid) {
      throw new UnauthorizedException('Signature is not valid');
    }
    return this.authService.sigIn(payloadDto.address);
  }
}
