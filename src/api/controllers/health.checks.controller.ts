import { Controller, Get, Logger } from '@nestjs/common';


@Controller('HealthChecks')
export class HealthChecksController {
  private readonly logger: Logger = new Logger(HealthChecksController.name);

  @Get()
  async healthCheck() {
    this.logger.log('healthCheck');
    return {
      detail: 'ok',
      result: 'working',
    };
  }
}
