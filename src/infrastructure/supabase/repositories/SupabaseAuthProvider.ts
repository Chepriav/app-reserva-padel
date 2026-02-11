import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import { AuthenticationError, InfrastructureError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';
import { Platform } from 'react-native';
import { supabase } from '../client';

export class SupabaseAuthProvider implements AuthProvider {
  async signIn(email: string, password: string): Promise<Result<{ userId: string }>> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok({ userId: data.user.id });
    } catch (err) {
      return fail(new AuthenticationError('Sign in failed', err));
    }
  }

  async signUp(email: string, password: string): Promise<Result<{ userId: string }>> {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok({ userId: data.user!.id });
    } catch (err) {
      return fail(new AuthenticationError('Sign up failed', err));
    }
  }

  async signOut(): Promise<Result<void>> {
    try {
      await supabase.auth.signOut();
      this.clearLocalSession();
      return ok(undefined);
    } catch {
      // Even if signOut fails, clear local session
      this.clearLocalSession();
      return ok(undefined);
    }
  }

  clearLocalSession(): void {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.localStorage) return;

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  async resetPassword(email: string): Promise<Result<void>> {
    try {
      const redirectTo = this.getPasswordResetRedirect();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        redirectTo ? { redirectTo } : undefined,
      );
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok(undefined);
    } catch (err) {
      return fail(new AuthenticationError('Password reset failed', err));
    }
  }

  async updatePassword(newPassword: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok(undefined);
    } catch (err) {
      return fail(new AuthenticationError('Password update failed', err));
    }
  }

  async getSession(): Promise<Result<{ userId: string } | null>> {
    try {
      // Read from localStorage for non-blocking performance on web
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
            try {
              const data = JSON.parse(localStorage.getItem(key)!);
              if (data?.access_token && data?.user) {
                return ok({ userId: data.user.id });
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
        return ok(null);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return ok(null);
      return ok({ userId: session.user.id });
    } catch (err) {
      return fail(new InfrastructureError('Failed to get session', err));
    }
  }

  async exchangeCodeForSession(code: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok(undefined);
    } catch (err) {
      return fail(new AuthenticationError('Code exchange failed', err));
    }
  }

  async setSession(accessToken: string, refreshToken: string): Promise<Result<void>> {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        return fail(new AuthenticationError(error.message, error));
      }
      return ok(undefined);
    } catch (err) {
      return fail(new AuthenticationError('Set session failed', err));
    }
  }

  private getPasswordResetRedirect(): string | null {
    const envRedirect = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL;
    if (envRedirect) return envRedirect;

    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.location?.origin
    ) {
      return `${window.location.origin}/reset-password`;
    }

    return null;
  }
}
