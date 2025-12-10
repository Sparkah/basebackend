import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// If '@farcaster/auth-client' exports AppClient as a default or named value, use the correct import:
//import { AppClient } from '@farcaster/auth-client';
// If this still fails, try importing as follows (uncomment the correct one):

// import AppClient from '@farcaster/auth-client';
// or
const { AppClient } = require('@farcaster/auth-client');
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
    private nonces = new Set<string>();
    private JWT_SECRET = process.env.JWT_SECRET || 'hackathon-secret';

    // ✅ Initialize Farcaster Client (relayUrl is standard)
    private farcasterClient = new AppClient({
        relayUrl: 'https://relay.farcaster.xyz',
        domain: 'basebackend-production-f4f9.up.railway.app' // ✅ Matches your public domain
    });

    constructor(private prisma: PrismaService) { }

    generateNonce(): string {
        const nonce = crypto.randomBytes(16).toString('hex');
        // Store nonce with timestamp to clean up later if needed
        this.nonces.add(nonce);
        return nonce;
    }

    async verifyFarcasterLogin(payload: { message: string, signature: string, nonce: string }): Promise<string> {
        const { message, signature, nonce } = payload;

        // 1. Verify Nonce (Prevent Replay Attacks)
        if (!this.nonces.has(nonce)) {
            throw new HttpException('Invalid or expired nonce', HttpStatus.BAD_REQUEST);
        }
        this.nonces.delete(nonce);

        // 2. Verify Farcaster Signature
        // This checks if the signature is valid and returns the user's FID
        const { success, fid, isError, error } = await this.farcasterClient.verifySignInMessage({
            message,
            signature,
            domain: 'basebackend-production-f4f9.up.railway.app', // Must match frontend domain
            nonce,
        });

        if (!success || isError) {
            console.error("FC Auth Error:", error);
            throw new HttpException(`Invalid login: ${error?.message}`, HttpStatus.UNAUTHORIZED);
        }

        // 3. Create or Update User using FID (Not Wallet)
        // We use 'upsert' to register them if it's their first time
        const user = await this.prisma.user.upsert({
            where: { fid }, 
            update: {},  
            create: {
                //id: id,
                fid: fid,
                username: 'user_${fid}',
                displayName: null,
                pfpUrl: null,
                walletAddress: null,
                currCoins: 0,
                ltimeCoins: 0,
                valueUpgrades: 0,
                critUpgrades: 0
            }
        });

        // 4. Return your App's Session Token (JWT)
        // The frontend will use THIS token for all future requests (Runs, Upgrades)
        return jwt.sign(
            {
                userId: user.id, // Database ID
                fid: user.fid
            },
            this.JWT_SECRET,
            { expiresIn: '7d' }
        );
    }
}