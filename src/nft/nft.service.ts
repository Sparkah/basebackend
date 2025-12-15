import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NftService {
    private account;
    private client;
    private publicClient;
    private contractAddress;

    // Define the Contract Interface
    private abi = parseAbi([
        'function mintScore(address to, uint256 score) external',
        'function isScoreMinted(uint256 score) external view returns (bool)'
    ]);

    constructor(private prisma: PrismaService) {
        // Initialize Viem Client
        const pk = process.env.PRIVATE_KEY;
        if (!pk) throw new Error("PRIVATE_KEY missing in .env");

        this.account = privateKeyToAccount(pk as `0x${string}`);

        this.client = createWalletClient({
            account: this.account,
            chain: baseSepolia,
            transport: http()
        });

        this.publicClient = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        this.contractAddress = process.env.CONTRACT_ADDRESS as `0x${string}`;
    }

    async getScoreStatus(score: number) {
        try {
            // 1. Ask Blockchain: Who owns this score?
            const ownerAddress = await this.publicClient.readContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'ownerOf',
                args: [BigInt(score)]
            }) as string;

            // 2. Ask Database: Who is this address?
            // We search case-insensitive because DB might have 0xABC and blockchain returns 0xabc
            const user = await this.prisma.user.findFirst({
                where: {
                    walletAddress: { equals: ownerAddress, mode: 'insensitive' }
                }
            });

            return {
                available: false,
                owner: user ? user.username : ownerAddress // Return Username or Address if unknown
            };

        } catch (e) {
            // If readContract fails, it usually means the token doesn't exist yet -> Available!
            return { available: true };
        }
    }

    async isScoreAvailable(score: number): Promise<boolean> {
        // Call the Smart Contract: isScoreMinted(score)
        const isMinted = await this.publicClient.readContract({
            address: this.contractAddress,
            abi: this.abi,
            functionName: 'isScoreMinted',
            args: [BigInt(score)]
        });

        // If isMinted is true, it's NOT available.
        return !isMinted;
    }

    async mintScore(userId: number, score: number) {
        // 1. Get User's Wallet
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.walletAddress) {
            throw new Error("User has no wallet linked!");
        }

        // 2. Double-check availability
        const available = await this.isScoreAvailable(score);
        if (!available) {
            throw new Error(`Score ${score} is already minted by someone else!`);
        }

        // 3. Send Transaction (Gasless for the user, Backend pays gas)
        try {
            const hash = await this.client.writeContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'mintScore',
                args: [user.walletAddress as `0x${string}`, BigInt(score)]
            });

            console.log(`Minted Score ${score} for ${user.username}. Hash: ${hash}`);
            return { success: true, txHash: hash };
        } catch (error) {
            console.error("Minting failed:", error);
            throw new InternalServerErrorException("Minting failed on blockchain");
        }
    }
}