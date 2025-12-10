import { Body, Controller, Get, Post } from '@nestjs/common';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runsService: RunsService) {}

  @Post('finish')
  async finish(@Body() body: { fid: number; score: number }) {
    const score = Number(body.score) || 0;
    const fid = Number(body.fid);

    return this.runsService.finishRun({ fid, score });
  }

  @Get('all')
  async getAllRuns() {
    return this.runsService.getAllRuns();
  }
}