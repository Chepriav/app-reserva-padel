import type { User } from '@domain/entities/User';
import type { AuthProvider } from '@domain/ports/repositories/AuthProvider';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import { UserNotFoundError, UserNotApprovedError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { ok, fail } from '@shared/types/Result';

export class LoginUser {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(email: string, password: string): Promise<Result<User>> {
    const authResult = await this.authProvider.signIn(email, password);
    if (!authResult.success) return authResult;

    const userResult = await this.userRepository.findById(authResult.value.userId);
    if (!userResult.success) {
      await this.authProvider.signOut();
      return userResult;
    }

    const user = userResult.value;
    if (!user) {
      await this.authProvider.signOut();
      return fail(new UserNotFoundError());
    }

    if (user.approvalStatus !== 'approved') {
      await this.authProvider.signOut();
      const message =
        user.approvalStatus === 'rejected'
          ? 'Registration request was rejected'
          : 'Account is pending admin approval';
      return fail(new UserNotApprovedError(message));
    }

    return ok(user);
  }
}
