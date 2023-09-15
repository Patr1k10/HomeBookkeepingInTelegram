import { Injectable, LoggerService } from '@nestjs/common';
import pino from 'pino';
import { config } from 'dotenv';

config();

@Injectable()
export class PinoLoggerService implements LoggerService {
  private readonly logger: pino.Logger;
  private context: string = '';

  constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string) {
    this.logger.info({ context: this.context }, message);
  }

  error(message: string, trace: string) {
    this.logger.error({ context: this.context, trace }, message);
  }

  warn(message: string) {
    this.logger.warn({ context: this.context }, message);
  }

  debug(message: string) {
    this.logger.debug({ context: this.context }, message);
  }

  verbose(message: string) {
    this.logger.trace({ context: this.context }, message);
  }
}
