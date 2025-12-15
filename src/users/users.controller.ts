import { Controller, Post, Req, Get, UseGuards, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly prisma: PrismaService
    ) { }

    @Get('profile')
    async getProfile(@Req() req) {
        return await this.usersService.findUserById(req.user.userId);
    }

    @Post('upgradecrit')
    async upgradeCrit(@Req() req) {
        return this.usersService.upgradeCrit(req.user.userId);
    }

    @Post('upgradevalue')
    async upgradeValue(@Req() req) {
        return this.usersService.upgradeValue(req.user.userId);
    }

    @Post('link-wallet')
    //@UseGuards(AuthGuard) // Ensure only logged-in users can call this
    async linkWallet(@Req() req, @Body() body: { walletAddress: string }) {
        const userId = req.user.userId;

        // Save to DB
        await this.prisma.user.update({
            where: { id: userId },
            data: { walletAddress: body.walletAddress }
        });

        return { success: true };
    }
}