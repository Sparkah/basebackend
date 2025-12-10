import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RunsService {
  constructor(private prisma: PrismaService) {}

  async finishRun(data: { fid: number; score: number }) {
    const userExists = await this.prisma.user.findUnique({
      where: { fid: data.fid }
    });

    if (!userExists) {
      throw new Error(`User with FID ${data.fid} not found. Did they login?`);
    }

    return this.prisma.run.create({
      data: {
        score: data.score,
        user: {
          connect: { fid: data.fid } 
        }
      },
    });
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