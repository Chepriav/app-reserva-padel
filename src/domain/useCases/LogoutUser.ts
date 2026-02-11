import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { Result } from '@shared/types/Result';

export class LogoutUser {
  constructor(private readonly authProvider: AuthProvider) {}

  execute(): Promise<Result<void>> {
    return this.authProvider.signOut();
  }
}
