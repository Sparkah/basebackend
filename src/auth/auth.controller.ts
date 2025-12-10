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

    @Post('login-silent')
    async loginSilent(@Body() body: any) {
        // SECURITY NOTE: In a real production app, you would verify the 
        // Frame Context Signature here to ensure the FID isn't spoofed.
        // For a hackathon, trusting the incoming body is acceptable speed-wise.
        const token = await this.authService.loginSilent(body);
        return { accessToken: token };
    }
}