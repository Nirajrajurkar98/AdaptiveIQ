import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AcceptTeacherInvitationDto, BootstrapAdminDto, LoginDto, RegisterStudentDto } from './auth.dto';
import { SessionGuard } from './auth.guards';
import { CurrentUser } from './auth.decorators';
import { readCookie } from './auth.security';
import type { AuthenticatedUser } from './auth.types';

const COOKIE_NAME = 'adaptiveiq_session';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setSessionCookie(response: Response, token: string): void {
  response.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

function noStore(response: Response): void { response.setHeader('Cache-Control', 'no-store'); }

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: RegisterStudentDto, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    const result = await this.authService.registerStudent(body.name, body.email, body.password);
    setSessionCookie(response, result.token);
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    const result = await this.authService.login(body.email, body.password);
    setSessionCookie(response, result.token);
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('bootstrap-admin')
  async bootstrapAdmin(@Body() body: BootstrapAdminDto, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    const result = await this.authService.bootstrapAdmin(body.name, body.email, body.password, body.bootstrapSecret);
    setSessionCookie(response, result.token);
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('invitations/accept')
  async acceptTeacherInvitation(@Body() body: AcceptTeacherInvitationDto, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    const result = await this.authService.acceptTeacherInvitation(body.name, body.password, body.invitationToken);
    setSessionCookie(response, result.token);
    return { user: result.user, expiresAt: result.expiresAt };
  }

  @Post('logout')
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    await this.authService.revokeSession(readCookie(request.headers.cookie, COOKIE_NAME));
    response.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }

  @Get('me')
  @UseGuards(SessionGuard)
  getCurrentUser(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) response: Response) {
    noStore(response);
    return { user };
  }
}
