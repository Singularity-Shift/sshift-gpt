import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Multisign, MultisignSchema } from './multisign.schema';
import { MultisignService } from './multisign.service';
import { MultisignController } from './multisign.controller';
import { UserModule } from '@nest-modules';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Multisign.name, schema: MultisignSchema },
    ]),
  ],
  providers: [MultisignService],
  controllers: [MultisignController],
  exports: [],
})
export class MultisignModule {}
