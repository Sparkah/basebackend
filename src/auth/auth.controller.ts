import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('nonce')
    getNonce() {
        return { nonce: this.authService.generateNonce() };
    }

    @Post('login')
    async login(@Body() body: { message: string; signature: string; nonce: string }) {
        return {
            accessToken: await this.authService.verifyFarcasterLogin(body)
        };
    }
}