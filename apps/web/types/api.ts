export type UserProfile = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: UserProfile;
};

export type KycSubmissionResponse = { status: string; id: string };
