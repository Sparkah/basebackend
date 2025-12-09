import { Controller, Get, StreamableFile, Header } from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

@Controller()
export class ManifestController {
  
  @Get('.well-known/farcaster.json')
  @Header('Content-Type', 'application/json')
  getManifest(): StreamableFile {
    // process.cwd() is usually safer in NestJS than __dirname 
    // because compiled code lives in /dist
    const file = createReadStream(join(process.cwd(), 'public/.well-known/farcaster.json'));
    
    return new StreamableFile(file);
  }
}