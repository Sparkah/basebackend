import { Controller, Post, Get, Body, Req, Param, UseGuards } from '@nestjs/common';
import { NftService } from './nft.service';

@Controller('nft')
export class NftController {
    constructor(private readonly nftService: NftService) { }

    @Get('check/:score')
    async checkScore(@Param('score') score: string) {
        return await this.nftService.getScoreStatus(Number(score));
    }

    @Post('mint')
    async mintScore(@Req() req, @Body() body: { score: number }) {
        const userId = req.user.userId; // Securely get ID from token
        return await this.nftService.mintScore(userId, body.score);
    }

    @Get('my-nfts')
    async getMyNfts(@Req() req) {
        return await this.nftService.getUserNfts(req.user.userId);
    }

    @Get('leaderboard')
    async getLeaderboard() {
        return await this.nftService.getNftLeaderboard();
    }
}