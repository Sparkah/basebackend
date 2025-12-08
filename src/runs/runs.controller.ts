import { Body, Controller, Get, Post } from '@nestjs/common';
import { RunsService } from './runs.service';
import { FinishRunDto } from './dto/finish-run.dto';

@Controller('runs')
export class RunsController {

    constructor(private readonly _runsService: RunsService) { }

    @Post('finish')
    async finish(@Body() body: FinishRunDto) {
        // in hackathon you can skip validation; later you can add class-validator
        var score = Number(body.score) || 0;

        return this._runsService.finishRun({
            walletAddress: body.walletAddress || 'anonymous',
            score: score,
        });
    }

    @Get('all')
    async getAllRuns() {
        return this._runsService.getAllRuns();
    }
}