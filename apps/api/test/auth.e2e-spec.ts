import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/api-exception.filter';
import { PrismaService } from '../src/database/prisma.service';
import { AuthService } from '../src/auth/auth.service';

describe('Authentication and role guards', () => {
  let app: INestApplication;
  const prisma = {
    authSession: { findUnique: jest.fn(), updateMany: jest.fn() },
    user: { findFirst: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), create: jest.fn(), count: jest.fn() },
    teacherInvitation: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    platformBootstrap: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const authService = {
    registerStudent: jest.fn(), login: jest.fn(), bootstrapAdmin: jest.fn(), acceptTeacherInvitation: jest.fn(),
    revokeSession: jest.fn(), createTeacherInvitation: jest.fn(), updateAccountStatus: jest.fn(),
    revokeTeacherInvitation: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService).useValue(prisma)
      .overrideProvider(AuthService).useValue(authService).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  function setSession(role: 'PLATFORM_ADMIN' | 'TEACHER' | 'STUDENT', overrides: Record<string, unknown> = {}) {
    prisma.authSession.findUnique.mockResolvedValue({
      id: 'session-1', tokenHash: 'unused', userId: 'user-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null,
      user: { id: 'user-1', email: 'user@example.com', displayName: 'Test User', role, status: 'ACTIVE', passwordHash: 'hash' },
      ...overrides,
    });
  }

  it('requires a valid session for current-user and protected admin endpoints', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
    await request(app.getHttpServer()).post('/api/v1/admin/teacher-invitations').send({ email: 'teacher@example.com' }).expect(401);
  });

  it('rejects cross-origin state-changing requests', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('Origin', 'https://untrusted.example').expect(403);
    await request(app.getHttpServer()).post('/api/v1/auth/logout').set('Origin', 'http://localhost:5173').expect(201);
  });

  it('returns the server identity from the current-user endpoint', async () => {
    setSession('STUDENT');
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', 'adaptiveiq_session=valid-token').expect(200)
      .expect({ user: { id: 'user-1', email: 'user@example.com', displayName: 'Test User', role: 'STUDENT', status: 'ACTIVE' } });
  });

  it('blocks students and teachers from platform-admin endpoints', async () => {
    setSession('STUDENT');
    await request(app.getHttpServer()).get('/api/v1/admin/users').set('Cookie', 'adaptiveiq_session=valid-token').expect(403);
    setSession('TEACHER');
    await request(app.getHttpServer()).get('/api/v1/admin/users').set('Cookie', 'adaptiveiq_session=valid-token').expect(403);
  });

  it('allows only the platform administrator to access administration', async () => {
    setSession('PLATFORM_ADMIN');
    prisma.user.findMany.mockResolvedValue([]);
    await request(app.getHttpServer()).get('/api/v1/admin/users').set('Cookie', 'adaptiveiq_session=valid-token').expect(200).expect({ users: [] });
  });

  it('restricts teacher invitation creation and revocation to platform administrators', async () => {
    setSession('STUDENT');
    await request(app.getHttpServer()).post('/api/v1/admin/teacher-invitations')
      .set('Cookie', 'adaptiveiq_session=valid-token').send({ email: 'teacher@example.com' }).expect(403);
    setSession('PLATFORM_ADMIN');
    authService.createTeacherInvitation.mockResolvedValue({ invitationId: 'invite-1', delivery: 'NOT_CONFIGURED' });
    authService.revokeTeacherInvitation.mockResolvedValue({ revoked: true });
    await request(app.getHttpServer()).post('/api/v1/admin/teacher-invitations')
      .set('Cookie', 'adaptiveiq_session=valid-token').send({ email: 'teacher@example.com' }).expect(201);
    await request(app.getHttpServer()).patch('/api/v1/admin/teacher-invitations/invite-1/revoke')
      .set('Cookie', 'adaptiveiq_session=valid-token').expect(200, { revoked: true });
  });

  it('rejects an expired or revoked session and deactivated accounts', async () => {
    setSession('STUDENT', { expiresAt: new Date(Date.now() - 1000) });
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', 'adaptiveiq_session=expired').expect(401);
    setSession('STUDENT', { revokedAt: new Date() });
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', 'adaptiveiq_session=revoked').expect(401);
    setSession('STUDENT', { user: { id: 'user-1', email: 'user@example.com', displayName: 'Test User', role: 'STUDENT', status: 'DEACTIVATED', passwordHash: 'hash' } });
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Cookie', 'adaptiveiq_session=inactive').expect(401);
    expect(prisma.authSession.updateMany).toHaveBeenCalled();
  });

  it('rejects browser-supplied account roles during public student registration', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Student', email: 'student@example.com', password: 'a-strong-student-password', role: 'PLATFORM_ADMIN',
    }).expect(400);
  });

  it('sets a host-only HTTP-only, SameSite cookie and clears it on logout', async () => {
    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: 'student@example.com', displayName: 'Student', role: 'STUDENT', status: 'ACTIVE' },
      token: 'opaque-test-session-token', expiresAt: new Date(Date.now() + 60_000),
    });
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login')
      .send({ email: 'student@example.com', password: 'a-strong-student-password' }).expect(201);
    expect(login.headers['set-cookie'][0]).toMatch(/adaptiveiq_session=opaque-test-session-token/);
    expect(login.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
    expect(login.headers['set-cookie'][0]).toMatch(/SameSite=Lax/i);
    expect(login.headers['set-cookie'][0]).not.toMatch(/Secure/i);

    const logout = await request(app.getHttpServer()).post('/api/v1/auth/logout')
      .set('Cookie', 'adaptiveiq_session=opaque-test-session-token').expect(201);
    expect(authService.revokeSession).toHaveBeenCalledWith('opaque-test-session-token');
    expect(logout.headers['set-cookie'][0]).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });

  it('always marks production session cookies Secure', async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    authService.login.mockResolvedValue({
      user: { id: 'user-1', email: 'student@example.com', displayName: 'Student', role: 'STUDENT', status: 'ACTIVE' },
      token: 'opaque-production-session-token', expiresAt: new Date(Date.now() + 60_000),
    });
    try {
      const result = await request(app.getHttpServer()).post('/api/v1/auth/login')
        .send({ email: 'student@example.com', password: 'a-strong-student-password' }).expect(201);
      expect(result.headers['set-cookie'][0]).toMatch(/Secure/i);
      expect(result.headers['set-cookie'][0]).not.toMatch(/Domain=/i);
    } finally {
      if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previousNodeEnv;
    }
  });
});
