import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { RunsModule } from './runs/runs.module';
import { RunsController } from './runs/runs.controller';
import { RunsService } from './runs/runs.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RunsModule,
  ],
  controllers: [AppController, RunsController],
  providers: [AppService, PrismaService, RunsService],
})
export class AppModule { }