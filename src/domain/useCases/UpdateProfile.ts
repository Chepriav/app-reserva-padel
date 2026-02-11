import type { User, ProfileUpdate } from '@domain/entities/User';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { Result } from '@shared/types/Result';

export class UpdateProfile {
  constructor(private readonly userRepository: UserRepository) {}

  execute(userId: string, updates: ProfileUpdate): Promise<Result<User>> {
    return this.userRepository.updateProfile(userId, updates);
  }
}
