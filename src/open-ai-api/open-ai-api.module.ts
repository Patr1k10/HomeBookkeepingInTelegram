import { Module } from '@nestjs/common';
import { OpenAiApiService } from './open-ai-api.service';

@Module({
  providers: [OpenAiApiService],
  exports: [OpenAiApiService],
})
export class OpenAiApiModule {}
