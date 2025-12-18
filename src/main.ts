import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

//https://f2b8f313.basefrontendbuild.pages.dev/
/*async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();*/

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: [
      'https://f2b8f313.basefrontendbuild.pages.dev',
      'http://localhost:7456',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(process.env.PORT || 3000);
}
bootstrap();