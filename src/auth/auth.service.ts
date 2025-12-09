import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyMessage } from 'ethers';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private nonces = new Set<string>();
    private JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

    constructor(private prisma: PrismaService) { }

    generateNonce(): string {
        const nonce = crypto.randomBytes(16).toString('hex');
        this.nonces.add(nonce);
        return nonce;
    }

    async verifyAndGetToken(address: string, message: string, signature: string): Promise<string> {
        // 1. extract nonce from message (assuming message includes it)
        const match = message.match(/Nonce: (\w{32})/);
        const nonce = match?.[1];
        if (!nonce || !this.nonces.has(nonce)) {
            throw new HttpException('Invalid nonce', HttpStatus.BAD_REQUEST);
        }
        this.nonces.delete(nonce);

        // 2. verify signature
        const recovered = verifyMessage(message, signature);
        if (recovered.toLowerCase() !== address.toLowerCase()) {
            throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
        }

        // 3. create user if not exists
        await this.prisma.user.upsert({
            where: { walletAddress: address.toLowerCase() },
            update: {},
            create: { walletAddress: address.toLowerCase() }
        });

        // 4. return JWT
        const token = jwt.sign({ walletAddress: address.toLowerCase() }, this.JWT_SECRET, { expiresIn: '7d' });
        return token;
    }
}
