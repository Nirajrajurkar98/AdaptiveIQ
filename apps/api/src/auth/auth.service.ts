import { ConflictException, ForbiddenException, Inject, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma, type User } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { createOpaqueToken, hashOpaqueToken, safeSecretEquals, SESSION_TTL_MS, TEACHER_INVITE_TTL_MS } from './auth.security';
import type { AuthenticatedUser } from './auth.types';
import { TEACHER_INVITATION_DELIVERY, type TeacherInvitationDelivery } from './teacher-invitation-delivery';

const ARGON2_OPTIONS: argon2.HashOptions = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

function normalizedEmail(email: string): string { return email.trim().toLowerCase(); }
function publicUser(user: Pick<User, 'id' | 'email' | 'displayName' | 'role' | 'status'>): AuthenticatedUser {
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role, status: user.status };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(TEACHER_INVITATION_DELIVERY) private readonly invitationDelivery: TeacherInvitationDelivery,
  ) {}

  async registerStudent(name: string, email: string, password: string): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
    const normalized = normalizedEmail(email);
    if (await this.prisma.user.findFirst({ where: { email: { equals: normalized, mode: 'insensitive' } }, select: { id: true } })) {
      throw new ConflictException('An account with this email already exists.');
    }
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    try {
      const user = await this.prisma.user.create({
        data: { email: normalized, displayName: name.trim(), passwordHash, role: 'STUDENT', status: 'ACTIVE' },
      });
      const session = await this.createSession(user.id);
      return { user: publicUser(user), ...session };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async login(email: string, password: string): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
    const user = await this.prisma.user.findFirst({ where: { email: normalizedEmail(email) } });
    if (!user?.passwordHash || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    if (user.status !== 'ACTIVE') throw new UnauthorizedException('This account is not active.');
    return { user: publicUser(user), ...(await this.createSession(user.id)) };
  }

  async bootstrapAdmin(name: string, email: string, password: string, providedSecret: string): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
    const configuredSecret = process.env.ADMIN_BOOTSTRAP_SECRET;
    if (!configuredSecret || configuredSecret.length < 32) {
      throw new ServiceUnavailableException('Administrator bootstrap is not configured.');
    }
    if (!safeSecretEquals(providedSecret, configuredSecret)) throw new UnauthorizedException('The bootstrap secret is invalid.');
    if (await this.prisma.user.count({ where: { role: 'PLATFORM_ADMIN' } })) {
      throw new ConflictException('The platform administrator has already been created.');
    }
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const normalized = normalizedEmail(email);
        const existing = await transaction.user.findFirst({ where: { email: { equals: normalized, mode: 'insensitive' } } });
        const user = existing
          ? await transaction.user.update({ where: { id: existing.id }, data: { email: normalized, displayName: name.trim(), passwordHash, role: 'PLATFORM_ADMIN', status: 'ACTIVE' } })
          : await transaction.user.create({
            data: { email: normalized, displayName: name.trim(), passwordHash, role: 'PLATFORM_ADMIN', status: 'ACTIVE' },
          });
        await transaction.platformBootstrap.create({ data: { id: 'primary', adminUserId: user.id } });
        const session = await this.createSession(user.id, transaction);
        return { user: publicUser(user), ...session };
      });
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('The platform administrator or email already exists.');
      }
      throw error;
    }
  }

  async createTeacherInvitation(email: string, adminUserId: string): Promise<{ invitationId: string; invitationUrl?: string; expiresAt: Date; delivery: 'SENT' | 'NOT_CONFIGURED' }> {
    const normalized = normalizedEmail(email);
    const existing = await this.prisma.user.findFirst({ where: { email: { equals: normalized, mode: 'insensitive' } }, select: { id: true } });
    if (existing) throw new ConflictException('An account with this email already exists.');
    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + TEACHER_INVITE_TTL_MS);
    const invitation = await this.prisma.$transaction(async (transaction) => {
      await transaction.teacherInvitation.updateMany({
        where: { email: normalized, consumedAt: null, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return transaction.teacherInvitation.create({
        data: { email: normalized, tokenHash: hashOpaqueToken(token), expiresAt, createdByUserId: adminUserId },
      });
    });
    const appUrl = (process.env.PUBLIC_APP_URL ?? 'http://localhost:5173').replace(/\/$/, '');
    const invitationUrl = `${appUrl}/#teacherInvite=${encodeURIComponent(token)}`;
    const delivery = await this.invitationDelivery.send(normalized, invitationUrl);
    return { invitationId: invitation.id, ...(delivery === 'NOT_CONFIGURED' ? { invitationUrl } : {}), expiresAt, delivery };
  }

  async revokeTeacherInvitation(invitationId: string): Promise<{ revoked: true }> {
    const result = await this.prisma.teacherInvitation.updateMany({
      where: { id: invitationId, consumedAt: null, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (result.count !== 1) throw new ConflictException('The invitation is already used, expired, or unavailable.');
    return { revoked: true };
  }

  async acceptTeacherInvitation(name: string, password: string, token: string): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
    const invitation = await this.prisma.teacherInvitation.findUnique({ where: { tokenHash: hashOpaqueToken(token) } });
    const now = new Date();
    if (!invitation || invitation.consumedAt || invitation.revokedAt || invitation.expiresAt <= now) {
      throw new UnauthorizedException('This teacher invitation is invalid or has expired.');
    }
    const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);
    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const claimed = await transaction.teacherInvitation.updateMany({
          where: { id: invitation.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
          data: { consumedAt: now },
        });
        if (claimed.count !== 1) throw new UnauthorizedException('This teacher invitation has already been used or expired.');
        const user = await transaction.user.create({
          data: { email: invitation.email, displayName: name.trim(), passwordHash, role: 'TEACHER', status: 'ACTIVE' },
        });
        const session = await this.createSession(user.id, transaction);
        return { user: publicUser(user), ...session };
      });
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with this email already exists.');
      }
      throw error;
    }
  }

  async revokeSession(token: string | undefined): Promise<void> {
    if (!token) return;
    await this.prisma.authSession.updateMany({
      where: { tokenHash: hashOpaqueToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async updateAccountStatus(userId: string, status: 'ACTIVE' | 'DEACTIVATED'): Promise<AuthenticatedUser> {
    const current = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!current || current.role !== 'TEACHER') {
      throw new ForbiddenException('Only teacher accounts can be activated or deactivated here.');
    }
    const user = await this.prisma.user.update({ where: { id: userId }, data: { status } });
    if (status === 'DEACTIVATED') {
      await this.prisma.authSession.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return publicUser(user);
  }

  private async createSession(userId: string, transaction: Prisma.TransactionClient | PrismaService = this.prisma): Promise<{ token: string; expiresAt: Date }> {
    const token = createOpaqueToken();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await transaction.authSession.create({ data: { userId, tokenHash: hashOpaqueToken(token), expiresAt } });
    return { token, expiresAt };
  }
}
