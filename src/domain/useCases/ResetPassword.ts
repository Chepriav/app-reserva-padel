import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { Result } from '@shared/types/Result';

export class ResetPassword {
  constructor(private readonly authProvider: AuthProvider) {}

  execute(email: string): Promise<Result<void>> {
    return this.authProvider.resetPassword(email);
  }
}
