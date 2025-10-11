export class UserProfileDto {
  id!: string;
  email!: string;
  firstName?: string | null;
  lastName?: string | null;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: UserProfileDto;
}
