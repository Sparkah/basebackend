import { Injectable, HttpException, HttpStatus, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService implements OnModuleInit {
    private nonces = new Set<string>();
    private JWT_SECRET = process.env.JWT_SECRET || 'hackathon-secret';
    private farcasterClient: any;

    constructor(private prisma: PrismaService) { }

    async onModuleInit() {
        const imported = await import('@farcaster/auth-client') as any;

        const createAppClient = imported.createAppClient;

        if (!createAppClient) {
            throw new Error("Could not find createAppClient function.");
        }

        this.farcasterClient = createAppClient({
            relayUrl: 'https://relay.farcaster.xyz',
            domain: 'basebackend-production-f4f9.up.railway.app'
        });

        console.log("✅ Farcaster Client Initialized Successfully");
    }

    async loginSilent(data: { fid: number; username?: string; displayName?: string; pfpUrl?: string }) {
        // 1. Upsert the user based on FID
        const user = await this.prisma.user.upsert({
            where: { fid: data.fid },
            update: {
                // Update profile info in case they changed it
                username: data.username,
                displayName: data.displayName,
                pfpUrl: data.pfpUrl
            },
            create: {
                fid: data.fid,
                username: data.username || `user_${data.fid}`,
                displayName: data.displayName,
                pfpUrl: data.pfpUrl,
                currCoins: 0,
                ltimeCoins: 0,
                valueUpgrades: 0,
                critUpgrades: 0
            }
        });

        // 2. Generate Session Token
        return jwt.sign(
            { userId: user.id, fid: user.fid },
            this.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }

    generateNonce(): string {
        const nonce = crypto.randomBytes(16).toString('hex');
        this.nonces.add(nonce);
        return nonce;
    }

    async verifyFarcasterLogin(payload: { message: string, signature: string, nonce: string }): Promise<string> {
        const { message, signature, nonce } = payload;

        // Ensure client is loaded
        if (!this.farcasterClient) {
            await this.onModuleInit();
        }

        if (!this.nonces.has(nonce)) {
            throw new HttpException('Invalid or expired nonce', HttpStatus.BAD_REQUEST);
        }
        this.nonces.delete(nonce);

        const { success, fid, isError, error } = await this.farcasterClient.verifySignInMessage({
            message,
            signature,
            domain: 'basebackend-production-f4f9.up.railway.app',
            nonce,
        });

        if (!success || isError) {
            console.error("FC Auth Error:", error);
            throw new HttpException(`Invalid login: ${error?.message}`, HttpStatus.UNAUTHORIZED);
        }

        const user = await this.prisma.user.upsert({
            where: { fid },
            update: {},
            create: {
                fid: fid,
                username: `user_${fid}`,
                displayName: null,
                pfpUrl: null,
                walletAddress: null,
                currCoins: 0,
                ltimeCoins: 0,
                valueUpgrades: 0,
                critUpgrades: 0
            }
        });

        return jwt.sign(
            { userId: user.id, fid: user.fid },
            this.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }
}