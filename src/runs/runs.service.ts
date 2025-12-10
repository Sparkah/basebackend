import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FinishRunDto } from './dto/finish-run.dto';

@Injectable()
export class RunsService {

    constructor(private readonly _prisma: PrismaService) {}

    async finishRun(dto: FinishRunDto) {
        var run = await this._prisma.run.create({
            data: {
                score: dto.score,
                user: {
                    connect: {
                        id: dto.userId,
                    },
                },
            },
        });

        return {
            id: run.id,
            score: run.score,
            createdAt: run.createdAt,
        };
    }

    async getAllRuns() {
        var runs = await this._prisma.run.findMany({
            orderBy: {
                score: 'desc',
            },
            take: 100,
        });

        return runs.map(run => ({
            id: run.id,
            score: run.score,
            createdAt: run.createdAt,
        }));
    }
}