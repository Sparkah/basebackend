import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { RunsModule } from './runs/runs.module';
import { RunsController } from './runs/runs.controller';
import { RunsService } from './runs/runs.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { AuthModule } from './auth/auth.module';
import { ManifestController } from './manifest/manifest.controller';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      // This points to the public folder in your project root
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/',
    }),
    PrismaModule,
    RunsModule,
    AuthModule,
  ],
  controllers: [AppController, RunsController, AuthController, ManifestController],
  providers: [AppService, PrismaService, RunsService, AuthService],
})
export class AppModule { }