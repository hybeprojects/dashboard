import { IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
  @IsOptional() @Matches(/^\d{6}$/) otp?: string;
}
