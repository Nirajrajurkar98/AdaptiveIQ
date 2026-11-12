import { Injectable } from '@nestjs/common';

export const TEACHER_INVITATION_DELIVERY = Symbol('TEACHER_INVITATION_DELIVERY');

export interface TeacherInvitationDelivery {
  send(email: string, invitationUrl: string): Promise<'SENT' | 'NOT_CONFIGURED'>;
}

/** Explicit no-provider adapter. It never logs or claims to send an invitation. */
@Injectable()
export class UnconfiguredTeacherInvitationDelivery implements TeacherInvitationDelivery {
  async send(_email: string, _invitationUrl: string): Promise<'NOT_CONFIGURED'> {
    return 'NOT_CONFIGURED';
  }
}
