import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class BootstrapAdminDto extends RegisterStudentDto {
  @IsString()
  @MinLength(32)
  @MaxLength(256)
  bootstrapSecret!: string;
}

export class CreateTeacherInvitationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}

export class AcceptTeacherInvitationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MinLength(32)
  @MaxLength(256)
  invitationToken!: string;
}

export class UpdateAccountStatusDto {
  @IsIn(['ACTIVE', 'DEACTIVATED'])
  status!: 'ACTIVE' | 'DEACTIVATED';
}
