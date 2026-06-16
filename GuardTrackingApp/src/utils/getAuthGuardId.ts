import { User } from '../types';

type AuthUser = User & {
  guard?: {
    id: string;
    employeeId?: string;
    status?: string;
  };
};

/** Resolve the guard table id from the authenticated user profile. */
export const getAuthGuardId = (user?: AuthUser | null): string | null =>
  user?.guard?.id ?? null;
