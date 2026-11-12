import * as argon2 from 'argon2';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { hashOpaqueToken } from './auth.security';
import { PrismaService } from '../database/prisma.service';
import type { TeacherInvitationDelivery } from './teacher-invitation-delivery';

function mockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1', email: 'student@example.com', displayName: 'A Student', passwordHash: '$argon2id$hash',
    role: 'STUDENT', status: 'ACTIVE', createdAt: new Date(), updatedAt: new Date(), ...overrides,
  };
}

describe('AuthService', () => {
  let prisma: Record<string, any>;
  let delivery: TeacherInvitationDelivery;
  let service: AuthService;

  beforeEach(() => {
    prisma = {
      user: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), count: jest.fn(), update: jest.fn(), findMany: jest.fn() },
      authSession: { create: jest.fn(), updateMany: jest.fn(), findUnique: jest.fn() },
      teacherInvitation: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
      platformBootstrap: { create: jest.fn() },
      $transaction: jest.fn(async (callback: (tx: Record<string, any>) => Promise<unknown>) => callback(prisma)),
    };
    delivery = { send: jest.fn().mockResolvedValue('NOT_CONFIGURED') };
    service = new AuthService(prisma as unknown as PrismaService, delivery);
  });

  it('registers students with an Argon2id password hash and server-assigned STUDENT role', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => mockUser(data));
    const result = await service.registerStudent('New Student', ' STUDENT@Example.com ', 'a-strong-student-password');

    expect(result.user).toMatchObject({ email: 'student@example.com', role: 'STUDENT', status: 'ACTIVE' });
    const createArgs = prisma.user.create.mock.calls[0][0] as { data: Record<string, unknown> };
    expect(createArgs.data.role).toBe('STUDENT');
    expect(createArgs.data.passwordHash).not.toBe('a-strong-student-password');
    await expect(argon2.verify(String(createArgs.data.passwordHash), 'a-strong-student-password')).resolves.toBe(true);
    const sessionArgs = prisma.authSession.create.mock.calls[0][0] as { data: { tokenHash: string } };
    expect(sessionArgs.data.tokenHash).not.toBe(result.token);
    expect(sessionArgs.data.tokenHash).toBe(hashOpaqueToken(result.token));
  });

  it('rejects a duplicate email before creating an account', async () => {
    prisma.user.findFirst.mockResolvedValue({ id: 'existing' });
    await expect(service.registerStudent('Another Student', 'student@example.com', 'a-strong-student-password'))
      .rejects.toBeInstanceOf(ConflictException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('accepts a correct password and rejects a wrong password', async () => {
    const passwordHash = await argon2.hash('a-strong-student-password');
    prisma.user.findFirst.mockResolvedValue(mockUser({ passwordHash }));
    await expect(service.login('STUDENT@example.com', 'a-strong-student-password')).resolves.toMatchObject({ user: { role: 'STUDENT' } });
    await expect(service.login('student@example.com', 'wrong-password')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('blocks inactive accounts from login', async () => {
    const passwordHash = await argon2.hash('a-strong-student-password');
    prisma.user.findFirst.mockResolvedValue(mockUser({ passwordHash, status: 'DEACTIVATED' }));
    await expect(service.login('student@example.com', 'a-strong-student-password')).rejects.toThrow('This account is not active.');
    expect(prisma.authSession.create).not.toHaveBeenCalled();
  });

  it('revokes the database session on logout without storing the raw token', async () => {
    const token = 'opaque-session-token';
    await service.revokeSession(token);
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tokenHash: hashOpaqueToken(token), revokedAt: null },
    }));
  });

  it('creates the first administrator once and rejects a repeated bootstrap', async () => {
    const previousSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    process.env.ADMIN_BOOTSTRAP_SECRET = 'a-private-bootstrap-secret-that-is-at-least-32-chars';
    try {
      prisma.user.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
      prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => mockUser({ ...data, role: 'PLATFORM_ADMIN' }));
      const created = await service.bootstrapAdmin('Admin User', 'admin@example.com', 'a-strong-admin-password', process.env.ADMIN_BOOTSTRAP_SECRET);
      expect(created.user.role).toBe('PLATFORM_ADMIN');
      expect(prisma.platformBootstrap.create).toHaveBeenCalledWith({ data: { id: 'primary', adminUserId: 'user-1' } });
      await expect(service.bootstrapAdmin('Admin User', 'admin@example.com', 'a-strong-admin-password', process.env.ADMIN_BOOTSTRAP_SECRET))
        .rejects.toBeInstanceOf(ConflictException);
    } finally {
      if (previousSecret === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
      else process.env.ADMIN_BOOTSTRAP_SECRET = previousSecret;
    }
  });

  it('rejects an invalid bootstrap secret before checking or creating accounts', async () => {
    const previousSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    process.env.ADMIN_BOOTSTRAP_SECRET = 'a-private-bootstrap-secret-that-is-at-least-32-chars';
    try {
      await expect(service.bootstrapAdmin('Admin User', 'admin@example.com', 'a-strong-admin-password', 'wrong-bootstrap-secret-value'))
        .rejects.toThrow('The bootstrap secret is invalid.');
      expect(prisma.user.count).not.toHaveBeenCalled();
      expect(prisma.user.create).not.toHaveBeenCalled();
    } finally {
      if (previousSecret === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
      else process.env.ADMIN_BOOTSTRAP_SECRET = previousSecret;
    }
  });

  it('can bootstrap an existing legacy user row only after the secret check', async () => {
    const previousSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    process.env.ADMIN_BOOTSTRAP_SECRET = 'a-private-bootstrap-secret-that-is-at-least-32-chars';
    try {
      prisma.user.count.mockResolvedValue(0);
      prisma.user.findFirst.mockResolvedValue(mockUser({ email: 'platform-admin@adaptiveiq.test', passwordHash: null, status: 'PENDING' }));
      prisma.user.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => mockUser({ ...data, id: 'legacy-user' }));
      const created = await service.bootstrapAdmin('Real Admin', 'platform-admin@adaptiveiq.test', 'a-strong-admin-password', process.env.ADMIN_BOOTSTRAP_SECRET);
      expect(created.user).toMatchObject({ id: 'legacy-user', role: 'PLATFORM_ADMIN', status: 'ACTIVE' });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.platformBootstrap.create).toHaveBeenCalledWith({ data: { id: 'primary', adminUserId: 'legacy-user' } });
    } finally {
      if (previousSecret === undefined) delete process.env.ADMIN_BOOTSTRAP_SECRET;
      else process.env.ADMIN_BOOTSTRAP_SECRET = previousSecret;
    }
  });

  it('creates an admin invitation with a hashed, expiring token and reports that email was not sent', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.teacherInvitation.updateMany.mockResolvedValue({ count: 0 });
    const created: Array<{ data: { tokenHash: string; expiresAt: Date } }> = [];
    prisma.teacherInvitation.create.mockImplementation(async (args: { data: { tokenHash: string; expiresAt: Date } }) => { created.push(args); return { id: 'invite-id', ...args.data }; });
    const result = await service.createTeacherInvitation('teacher@example.com', 'admin-1');
    const token = new URL(result.invitationUrl!).hash.slice('#teacherInvite='.length);
    expect(result.delivery).toBe('NOT_CONFIGURED');
    expect(created[0].data.tokenHash).toBe(hashOpaqueToken(decodeURIComponent(token)));
    expect(created[0].data.expiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(delivery.send).toHaveBeenCalledWith('teacher@example.com', result.invitationUrl);
    expect(result.invitationId).toBe('invite-id');
  });

  it('rejects expired and previously used teacher invitations', async () => {
    const common = { id: 'invite-1', email: 'teacher@example.com', tokenHash: hashOpaqueToken('invite-token'), revokedAt: null, createdAt: new Date(), createdByUserId: 'admin-1' };
    prisma.teacherInvitation.findUnique.mockResolvedValueOnce({ ...common, expiresAt: new Date(Date.now() - 1000), consumedAt: null });
    await expect(service.acceptTeacherInvitation('Teacher', 'a-strong-teacher-password', 'invite-token')).rejects.toBeInstanceOf(UnauthorizedException);
    prisma.teacherInvitation.findUnique.mockResolvedValueOnce({ ...common, expiresAt: new Date(Date.now() + 60_000), consumedAt: new Date() });
    await expect(service.acceptTeacherInvitation('Teacher', 'a-strong-teacher-password', 'invite-token')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('does not accept an invitation that was concurrently consumed', async () => {
    prisma.teacherInvitation.findUnique.mockResolvedValue({
      id: 'invite-1', email: 'teacher@example.com', tokenHash: hashOpaqueToken('invite-token'),
      expiresAt: new Date(Date.now() + 60_000), consumedAt: null, revokedAt: null,
      createdAt: new Date(), createdByUserId: 'admin-1',
    });
    prisma.teacherInvitation.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.acceptTeacherInvitation('Teacher', 'a-strong-teacher-password', 'invite-token')).rejects.toThrow(/already been used/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('activates a teacher only by consuming a valid admin-created invitation', async () => {
    prisma.teacherInvitation.findUnique.mockResolvedValue({
      id: 'invite-1', email: 'teacher@example.com', tokenHash: hashOpaqueToken('invite-token'),
      expiresAt: new Date(Date.now() + 60_000), consumedAt: null, revokedAt: null,
      createdAt: new Date(), createdByUserId: 'admin-1',
    });
    prisma.teacherInvitation.updateMany.mockResolvedValue({ count: 1 });
    prisma.user.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => mockUser({ ...data, role: 'TEACHER' }));
    const result = await service.acceptTeacherInvitation('Teacher Person', 'a-strong-teacher-password', 'invite-token');
    expect(result.user).toMatchObject({ email: 'teacher@example.com', role: 'TEACHER', status: 'ACTIVE' });
    expect(prisma.teacherInvitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { consumedAt: expect.any(Date) } }));
  });

  it('allows an administrator to revoke an invitation that has not been consumed', async () => {
    prisma.teacherInvitation.updateMany.mockResolvedValue({ count: 1 });
    await expect(service.revokeTeacherInvitation('invite-1')).resolves.toEqual({ revoked: true });
    expect(prisma.teacherInvitation.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invite-1', consumedAt: null, revokedAt: null },
    }));
  });

  it('revokes teacher sessions when an administrator deactivates the account', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser({ role: 'TEACHER' }));
    prisma.user.update.mockResolvedValue(mockUser({ role: 'TEACHER', status: 'DEACTIVATED' }));
    prisma.authSession.updateMany.mockResolvedValue({ count: 2 });
    await expect(service.updateAccountStatus('teacher-1', 'DEACTIVATED')).resolves.toMatchObject({ status: 'DEACTIVATED' });
    expect(prisma.authSession.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'teacher-1', revokedAt: null },
    }));
  });
});
