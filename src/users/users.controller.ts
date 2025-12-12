import { Controller, Post, Body, Req, HttpException, HttpStatus, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile') // returns coins, upgrades
    async getProfile(@Req() req) {
        const userId = req.user.userId;
        console.log("Fetching profile for User ID:", userId);
        return await this.usersService.findUserById(userId);
    }

    @Post('upgradecrit')
    async upgradeCrit(@Req() req, @Body() body: { userId: number }) {
        return this.usersService.upgradeCrit(body.userId);
    }

    @Post('upgradevalue')
    async upgradeValue(@Req() req, @Body() body: { userId: number }) {
        return this.usersService.upgradeValue(body.userId);
    }
}