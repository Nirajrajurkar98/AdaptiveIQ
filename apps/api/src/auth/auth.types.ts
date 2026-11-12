import type { AccountRole, AccountStatus } from '../generated/prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  status: AccountStatus;
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: AuthenticatedUser;
      sessionToken?: string;
    }
  }
}
