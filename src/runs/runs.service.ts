import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RunsService {
  constructor(private prisma: PrismaService) { }

  async finishRun(data: { fid: number; score: number }) {
    // 1. Safety Check: Ensure user exists
    const userExists = await this.prisma.user.findUnique({
      where: { fid: data.fid }
    });

    if (!userExists) {
      throw new Error(`User with FID ${data.fid} not found. Did they login?`);
    }

    // 2. Perform both operations in a Transaction
    // The result will be an array containing the results of both queries
    const [run, updatedUser] = await this.prisma.$transaction([

      // Operation A: Create the Run Record (For Leaderboard)
      this.prisma.run.create({
        data: {
          score: data.score,
          user: { connect: { fid: data.fid } }
        },
      }),

      // Operation B: Give the user Coins (For Shop/Upgrades)
      this.prisma.user.update({
        where: { fid: data.fid },
        data: {
          // Atomic Increment: Safe even if multiple requests happen at once
          currCoins: { increment: data.score },
          ltimeCoins: { increment: data.score }
        }
      })
    ]);

    return {
      runId: run.id,
      score: run.score,
      newBalance: updatedUser.currCoins
    };
  }

  async getAllRuns() {
    return this.prisma.run.findMany({
      take: 50,
      orderBy: { score: 'desc' },
      include: {
        user: {
          select: { username: true, fid: true }
        }
      }
    });
  }
}