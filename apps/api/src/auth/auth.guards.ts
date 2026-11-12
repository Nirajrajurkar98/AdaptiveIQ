import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../database/prisma.service';
import { REQUIRED_ROLES } from './auth.decorators';
import { configuredWebOrigin, hashOpaqueToken, readCookie } from './auth.security';
import type { AuthenticatedUser } from './auth.types';
import type { Request } from 'express';
import type { AccountRole } from '../generated/prisma/client';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Reject browser state changes from origins other than the configured web app. */
@Injectable()
export class SameSiteOriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!STATE_CHANGING_METHODS.has(request.method.toUpperCase())) return true;
    const origin = request.headers.origin;
    if (!origin) return true; // Non-browser clients may omit Origin; browser requests include it.
    if (origin !== configuredWebOrigin()) {
      throw new ForbiddenException('This request origin is not allowed.');
    }
    return true;
  }
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = readCookie(request.headers.cookie, 'adaptiveiq_session');
    if (!token) throw new UnauthorizedException('Please sign in to continue.');

    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash: hashOpaqueToken(token) },
      include: { user: true },
    });
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now) {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }
    if (session.user.status !== 'ACTIVE' || !session.user.passwordHash) {
      await this.prisma.authSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
      throw new UnauthorizedException('This account is not active.');
    }
    request.authenticatedUser = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role,
      status: session.user.status,
    };
    request.sessionToken = token;
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<AccountRole[]>(REQUIRED_ROLES, [context.getHandler(), context.getClass()]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.authenticatedUser as AuthenticatedUser | undefined;
    if (!user) throw new UnauthorizedException('Please sign in to continue.');
    if (!roles.includes(user.role)) throw new ForbiddenException('You do not have permission to access this resource.');
    return true;
  }
}
