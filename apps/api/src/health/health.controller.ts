import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  getHealth(): { status: 'ok'; service: 'adaptiveiq-api' } {
    return this.healthService.getHealth();
  }

  @Get('database')
  getDatabaseHealth(): Promise<{ status: 'ok'; database: 'connected' }> {
    return this.healthService.getDatabaseHealth();
  }
}
