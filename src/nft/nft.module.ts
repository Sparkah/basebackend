import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [NftController],
  providers: [NftService, PrismaService],
})
export class NftModule {}