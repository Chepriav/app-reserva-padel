import type { Result } from '@shared/types/Result';

/**
 * Port for authentication operations.
 * Abstracts the auth SDK (e.g., Supabase Auth) from domain logic.
 */
export interface AuthProvider {
  signIn(email: string, password: string): Promise<Result<{ userId: string }>>;
  signUp(email: string, password: string): Promise<Result<{ userId: string }>>;
  signOut(): Promise<Result<void>>;
  clearLocalSession(): void;
  resetPassword(email: string): Promise<Result<void>>;
  updatePassword(newPassword: string): Promise<Result<void>>;
  getSession(): Promise<Result<{ userId: string } | null>>;
  exchangeCodeForSession(code: string): Promise<Result<void>>;
  setSession(accessToken: string, refreshToken: string): Promise<Result<void>>;
}
