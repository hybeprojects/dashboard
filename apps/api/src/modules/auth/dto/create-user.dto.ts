import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString() firstName!: string;
  @IsString() lastName!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(12) password!: string;
}
