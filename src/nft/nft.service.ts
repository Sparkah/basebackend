import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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

    private abi = parseAbi([
        'function mintScore(address to, uint256 score) external',
        'function isScoreMinted(uint256 score) external view returns (bool)',
        'function ownerOf(uint256 tokenId) external view returns (address)'
    ]);

    constructor(private prisma: PrismaService) {
        let pk = process.env.PRIVATE_KEY;
        if (!pk) throw new Error("PRIVATE_KEY missing in .env");

        // ✅ AUTO-FIX: Ensure Private Key starts with 0x
        if (!pk.startsWith('0x')) {
            console.log("⚠️ Fixing Private Key format...");
            pk = `0x${pk}`;
        }
        
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

    async isScoreAvailable(score: number): Promise<boolean> {
        try {
            const isMinted = await this.publicClient.readContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'isScoreMinted',
                args: [BigInt(score)]
            });
            return !isMinted; 
        } catch (e) {
            return true; // Assume available if check fails
        }
    }

    async getScoreStatus(score: number) {
        try {
            const ownerAddress = await this.publicClient.readContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'ownerOf',
                args: [BigInt(score)]
            }) as string;

            const user = await this.prisma.user.findFirst({
                where: { walletAddress: { equals: ownerAddress, mode: 'insensitive' } }
            });

            return { available: false, owner: user ? user.username : ownerAddress };
        } catch (e) {
            return { available: true };
        }
    }

    async mintScore(userId: number, score: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        
        if (!user || !user.walletAddress) {
            throw new BadRequestException("Please connect your wallet first!");
        }

        const available = await this.isScoreAvailable(score);
        if (!available) {
            throw new BadRequestException(`Score ${score} is already minted!`);
        }

        try {
            console.log(`Minting Score ${score} to ${user.walletAddress}...`);
            
            // 1. Mint on Blockchain
            const hash = await this.client.writeContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'mintScore',
                args: [user.walletAddress as `0x${string}`, BigInt(score)]
            });

            console.log(`✅ Blockchain Success! Hash: ${hash}`);

            // 2. SAVE TO DATABASE (This was missing!)
            await this.prisma.mintedScore.create({
                data: {
                    score: score,
                    ownerId: userId,
                    txHash: hash
                }
            });
            console.log("✅ Database Success! Saved to Leaderboard.");

            return { success: true, txHash: hash };
        } catch (error) {
            console.error("Minting failed:", error);
            throw new InternalServerErrorException("Minting failed");
        }
    }

    // --- LEADERBOARD METHODS ---

    async getUserNfts(userId: number) {
        return await this.prisma.mintedScore.findMany({
            where: { ownerId: userId },
            orderBy: { score: 'desc' }
        });
    }

    async getNftLeaderboard() {
        return await this.prisma.mintedScore.findMany({
            take: 20, 
            orderBy: { score: 'desc' },
            include: { 
                owner: { select: { username: true } } 
            }
        });
    }
}