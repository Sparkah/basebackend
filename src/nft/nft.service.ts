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

    async generateAiImage(score: number): Promise<string> {
        // Fallback: Red Pixel (Just in case)
        const fallbackImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

        try {
            console.log(`🎨 Generating AI Image via Pollinations for Score ${score}...`);
            
            // 1. Construct the Pollinations URL
            // We use 'pixel art' style to match your game
            const prompt = `8-bit pixel art golden trophy cup, magical game asset, score ${score}, white background`;
            const encodedPrompt = encodeURIComponent(prompt);
            
            // Pollinations URL pattern: https://image.pollinations.ai/prompt/{prompt}
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=256&height=256&nologo=true`;

            // 2. Fetch the Image
            const response = await fetch(url);

            if (!response.ok) {
                console.error("Pollinations Failed:", response.statusText);
                return fallbackImage;
            }

            // 3. Convert to Base64
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const base64String = `data:image/jpeg;base64,${buffer.toString('base64')}`;
            
            console.log("✅ AI Image Generated Successfully!");
            return base64String;

        } catch (e) {
            console.error("AI Generation Error:", e);
            return fallbackImage;
        }
    }

    // 2. Updated Mint Logic
    async mintScore(userId: number, score: number) {
        // ... (Keep existing checks for user/wallet/availability) ...
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.walletAddress) throw new BadRequestException("Connect wallet first!");

        const available = await this.isScoreAvailable(score);
        if (!available) {
            // ... (Keep ownership check logic) ...
            throw new BadRequestException(`Score ${score} is already minted!`);
        }

        try {
            console.log(`Minting Score ${score}...`);
            const hash = await this.client.writeContract({
                address: this.contractAddress,
                abi: this.abi,
                functionName: 'mintScore',
                args: [user.walletAddress as `0x${string}`, BigInt(score)]
            });
            console.log(`✅ Hash: ${hash}`);

            // Generate Image (Will return Fallback if API fails)
            const aiImage = await this.generateAiImage(score);

            try {
                await this.prisma.mintedScore.create({
                    data: {
                        score: score,
                        ownerId: userId,
                        txHash: hash,
                        imageUrl: aiImage // ✅ Always has data now
                    }
                });
                console.log("✅ Saved to DB.");
            } catch (dbError) {
                console.warn("⚠️ Score already in DB (Duplicate save ignored).");
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