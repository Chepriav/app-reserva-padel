import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { Result } from '@shared/types/Result';

export class UpdatePassword {
  constructor(private readonly authProvider: AuthProvider) {}

  execute(newPassword: string): Promise<Result<void>> {
    return this.authProvider.updatePassword(newPassword);
  }
}
