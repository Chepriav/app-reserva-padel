import type { ApartmentUser } from '@domain/entities/User';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import { ValidationError } from '@domain/errors/DomainErrors';
import type { Result } from '@shared/types/Result';
import { fail } from '@shared/types/Result';

export class GetApartmentUsers {
  constructor(private readonly userRepository: UserRepository) {}

  execute(apartment: string): Promise<Result<ApartmentUser[]>> {
    if (!apartment) {
      return Promise.resolve(fail(new ValidationError('Apartment is required')));
    }
    return this.userRepository.findByApartment(apartment);
  }
}
