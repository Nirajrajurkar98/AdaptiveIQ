CREATE TYPE "AccountRole" AS ENUM ('PLATFORM_ADMIN', 'TEACHER', 'STUDENT');
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'DEACTIVATED');

ALTER TABLE "User"
  ADD COLUMN "passwordHash" TEXT,
  ADD COLUMN "role" "AccountRole" NOT NULL DEFAULT 'STUDENT',
  ADD COLUMN "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';

CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "TeacherInvitation" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdByUserId" TEXT NOT NULL,
  CONSTRAINT "TeacherInvitation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlatformBootstrap" (
  "id" TEXT NOT NULL,
  "adminUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlatformBootstrap_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");
CREATE INDEX "AuthSession_userId_expiresAt_idx" ON "AuthSession"("userId", "expiresAt");
CREATE INDEX "AuthSession_expiresAt_idx" ON "AuthSession"("expiresAt");
CREATE UNIQUE INDEX "TeacherInvitation_tokenHash_key" ON "TeacherInvitation"("tokenHash");
CREATE INDEX "TeacherInvitation_email_expiresAt_idx" ON "TeacherInvitation"("email", "expiresAt");
CREATE INDEX "TeacherInvitation_expiresAt_idx" ON "TeacherInvitation"("expiresAt");
CREATE UNIQUE INDEX "PlatformBootstrap_adminUserId_key" ON "PlatformBootstrap"("adminUserId");

ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TeacherInvitation"
  ADD CONSTRAINT "TeacherInvitation_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlatformBootstrap"
  ADD CONSTRAINT "PlatformBootstrap_adminUserId_fkey"
  FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
