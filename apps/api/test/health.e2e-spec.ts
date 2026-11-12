import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { PrismaService } from '../src/database/prisma.service';

describe('Health API', () => {
  let app: INestApplication;
  const prisma = { $queryRaw: jest.fn() };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /api/v1/health reports the API is running', async () => {
    await request(app.getHttpServer()).get('/api/v1/health').expect(200).expect({ status: 'ok', service: 'adaptiveiq-api' });
  });

  it('GET /api/v1/health/database confirms a database query', async () => {
    prisma.$queryRaw.mockResolvedValueOnce(1);
    await request(app.getHttpServer()).get('/api/v1/health/database').expect(200).expect({ status: 'ok', database: 'connected' });
  });

  it('uses a consistent 503 error response if the database query fails', async () => {
    prisma.$queryRaw.mockRejectedValueOnce(new Error('connection refused'));
    const response = await request(app.getHttpServer()).get('/api/v1/health/database').expect(503);
    expect(response.body).toMatchObject({ statusCode: 503, error: 'SERVICE_UNAVAILABLE', message: 'Database connection is unavailable' });
    expect(response.body.path).toBe('/api/v1/health/database');
    expect(response.body.timestamp).toEqual(expect.any(String));
  });
});
