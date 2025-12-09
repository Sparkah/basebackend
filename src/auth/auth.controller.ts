import { Controller, Get, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private readonly auth: AuthService) { }

    @Get('nonce')
    getNonce() {
        return { nonce: this.auth.generateNonce() };
    }

    @Post('verify')
    async verify(@Body() body: { address: string; message: string; signature: string }) {
        const { address, message, signature } = body;
        const jwt = await this.auth.verifyAndGetToken(address, message, signature);
        return { token: jwt };
    }
}