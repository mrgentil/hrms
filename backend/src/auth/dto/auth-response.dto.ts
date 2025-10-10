import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  access_token: string;
  refresh_token: string;
  user: {
    id: number;
    username: string;
    full_name: string;
    role: UserRole;
    work_email?: string;
    active: boolean;
  };
}
