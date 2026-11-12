import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AccountRole } from '../generated/prisma/client';
import { CurrentUser, Roles } from '../auth/auth.decorators';
import { CreateTeacherInvitationDto, UpdateAccountStatusDto } from '../auth/auth.dto';
import { RolesGuard, SessionGuard } from '../auth/auth.guards';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/auth.types';

@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles(AccountRole.PLATFORM_ADMIN)
export class AdminController {
  constructor(private readonly authService: AuthService, private readonly prisma: PrismaService) {}

  @Post('teacher-invitations')
  createTeacherInvitation(@Body() body: CreateTeacherInvitationDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.authService.createTeacherInvitation(body.email, admin.id);
  }

  @Patch('teacher-invitations/:id/revoke')
  revokeTeacherInvitation(@Param('id') id: string) {
    return this.authService.revokeTeacherInvitation(id);
  }

  @Get('users')
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: { id: true, email: true, displayName: true, role: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return { users };
  }

  @Patch('users/:id/status')
  updateAccountStatus(@Param('id') id: string, @Body() body: UpdateAccountStatusDto) {
    return this.authService.updateAccountStatus(id, body.status);
  }
}
