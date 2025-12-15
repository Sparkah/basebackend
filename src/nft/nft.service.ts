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

    async generateAiImage(score: number): Promise<string | null> {
        const hfToken = process.env.HF_ACCESS_TOKEN;
        if (!hfToken) return null;

        try {
            console.log(`🎨 Generating AI Image for Score ${score}...`);

            // ✅ UPDATED URL: api-inference -> router
            const response = await fetch(
                "https://router.huggingface.co/black-forest-labs/FLUX.1-schnell",
                {
                    headers: {
                        Authorization: `Bearer ${hfToken}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({
                        inputs: `A high quality 8-bit pixel art icon of a golden trophy cup, magical items, game asset, score ${score}, white background`,
                    }),
                }
            );

            if (!response.ok) {
                // Log but don't crash
                console.error("AI Gen Failed:", await response.text());
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            return `data:image/jpeg;base64,${buffer.toString('base64')}`;

        } catch (e) {
            console.error("AI Generation Error:", e);
            return null; // Fallback to 🏆
        }
    }

    // 2. FIXED: Robust Database Saving
    async mintScore(userId: number, score: number) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.walletAddress) throw new BadRequestException("Connect wallet first!");

        const available = await this.isScoreAvailable(score);

        // Safety: If blockchain says it's taken, check if WE own it.
        // If we own it (maybe previous request crashed halfway), we just return success.
        if (!available) {
            const status = await this.getScoreStatus(score);
            if (status.owner === user.username) {
                return { success: true, message: "Already minted by you!" };
            }
            throw new BadRequestException(`Score ${score} is already minted!`);
        }

        try {
            console.log(`Minting Score ${score} to ${user.walletAddress}...`);

            const hash = await this.client.writeContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'mintScore',
                args: [user.walletAddress as `0x${string}`, BigInt(score)]
            });

            console.log(`✅ Blockchain Success! Hash: ${hash}`);

            // Generate Image (Non-blocking: if it fails, we still continue)
            const aiImage = await this.generateAiImage(score);

            // ✅ SAFE SAVE: Try to save, but ignore if it already exists
            try {
                await this.prisma.mintedScore.create({
                    data: {
                        score: score,
                        ownerId: userId,
                        txHash: hash,
                        imageUrl: aiImage
                    }
                });
                console.log("✅ Database Success! Saved to Leaderboard.");
            } catch (dbError: any) {
                // Ignore P2002 (Unique constraint failed) - It means we already saved it!
                if (dbError.code === 'P2002') {
                    console.warn("⚠️ Score already in DB. Skipping save.");
                } else {
                    console.error("❌ Database Error:", dbError);
                    // We do NOT throw here. The user has their NFT, so we return success.
                }
            }

            return { success: true, txHash: hash, imageUrl: aiImage };

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