import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard, SameSiteOriginGuard, SessionGuard } from './auth.guards';
import { TEACHER_INVITATION_DELIVERY, UnconfiguredTeacherInvitationDelivery } from './teacher-invitation-delivery';
import { APP_GUARD } from '@nestjs/core';

@Module({
  controllers: [AuthController],
  providers: [AuthService, SessionGuard, RolesGuard, { provide: APP_GUARD, useClass: SameSiteOriginGuard }, { provide: TEACHER_INVITATION_DELIVERY, useClass: UnconfiguredTeacherInvitationDelivery }],
  exports: [AuthService, SessionGuard, RolesGuard],
})
export class AuthModule {}
