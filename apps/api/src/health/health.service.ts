import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getHealth(): { status: 'ok'; service: 'adaptiveiq-api' } {
    return { status: 'ok', service: 'adaptiveiq-api' };
  }

  async getDatabaseHealth(): Promise<{ status: 'ok'; database: 'connected' }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('Database connection is unavailable');
    }
  }
}
