import { Controller, Post, Req, Get } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('profile')
    async getProfile(@Req() req) {
        return await this.usersService.findUserById(req.user.userId);
    }

    @Post('upgradecrit')
    async upgradeCrit(@Req() req) {
        // ✅ FIX: Read ID from the Token, NOT the Body
        return this.usersService.upgradeCrit(req.user.userId);
    }

    @Post('upgradevalue')
    async upgradeValue(@Req() req) {
        // ✅ FIX: Read ID from the Token, NOT the Body
        return this.usersService.upgradeValue(req.user.userId);
    }
}