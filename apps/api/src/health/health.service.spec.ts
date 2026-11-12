import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';
import { PrismaService } from '../database/prisma.service';

describe('HealthService', () => {
  const queryRaw = jest.fn<Promise<unknown>, []>();
  const service = new HealthService({ $queryRaw: queryRaw } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('returns service health without accessing the database', () => {
    expect(service.getHealth()).toEqual({ status: 'ok', service: 'adaptiveiq-api' });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('checks a real database query', async () => {
    queryRaw.mockResolvedValue(1);
    await expect(service.getDatabaseHealth()).resolves.toEqual({ status: 'ok', database: 'connected' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns a service unavailable error when the database is unreachable', async () => {
    queryRaw.mockRejectedValue(new Error('connection refused'));
    await expect(service.getDatabaseHealth()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
