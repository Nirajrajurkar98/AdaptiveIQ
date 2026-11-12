import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { AccountRole } from '../generated/prisma/client';
import type { AuthenticatedUser } from './auth.types';

export const REQUIRED_ROLES = 'requiredRoles';
export const Roles = (...roles: AccountRole[]) => SetMetadata(REQUIRED_ROLES, roles);

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const request = context.switchToHttp().getRequest<Request>();
  if (!request.authenticatedUser) throw new Error('Authenticated user is unavailable');
  return request.authenticatedUser;
});
