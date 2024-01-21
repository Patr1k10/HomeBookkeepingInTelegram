import { Injectable, Logger } from '@nestjs/common';
import { OpenAI } from 'openai';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionAssistantMessageParam, ChatCompletionCreateParams } from 'openai/resources';

@Injectable()
export class OpenAiApiService {
  private readonly logger: Logger = new Logger(OpenAiApiService.name);
  private openAI: OpenAI;
  constructor(configService: ConfigService) {
    const apiKey = configService.getOrThrow('OPENAI_API_KEY');
    this.openAI = new OpenAI({ apiKey: apiKey });
  }

  // Method to generate a response using OpenAI Chat API.
  async generateResponse(messages: ChatCompletionAssistantMessageParam[]): Promise<string> {
    const params: ChatCompletionCreateParams = {
      model: 'gpt-3.5-turbo',
      messages: messages,
    };
    try {
      const response = await this.openAI.chat.completions.create(params);

      this.logger.log(`total_tokens:${response.usage.total_tokens}`);
      this.logger.log('generateResponse');
      return response.choices[0].message.content;
    } catch (e) {
      this.logger.error(e);
      return e;
    }
  }
}
