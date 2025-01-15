import { ApiProperty } from '@nestjs/swagger';
import { GetLensProfileDto } from './get-lens-profile.dto';

export class TrendingDto {
  static fromJson(userDto: TrendingDto, protocol: string): TrendingDto {
    const user: GetLensProfileDto = { ...userDto.user };
    if (protocol === 'Lens') {
      user.handle.localName = `https://handlefinder.xyz/profile/${userDto.user.id}`;
    }

    if (protocol === 'Farcaster') {
      user.handle.localName = `https://warpcast.com/${userDto.user.handle?.localName}`;
    }

    return new TrendingDto(user, userDto.topFollowers);
  }

  @ApiProperty({
    type: GetLensProfileDto,
    description: 'User trending profie',
  })
  user: GetLensProfileDto;

  @ApiProperty({
    type: [GetLensProfileDto],
    description: 'Top followers profie',
  })
  topFollowers: GetLensProfileDto[];

  constructor(user: GetLensProfileDto, topFollowers: GetLensProfileDto[]) {
    this.user = user;
    this.topFollowers = topFollowers;
  }
}
