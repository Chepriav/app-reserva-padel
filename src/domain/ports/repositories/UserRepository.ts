import type { User, ApartmentUser, RegisterData, ProfileUpdate } from '@domain/entities/User';
import type { Result } from '@shared/types/Result';

/**
 * Port for user profile persistence.
 * Implemented by infrastructure adapters (e.g., Supabase).
 */
export interface UserRepository {
  findById(userId: string): Promise<Result<User | null>>;
  findByApartment(apartment: string): Promise<Result<ApartmentUser[]>>;
  create(userId: string, data: RegisterData): Promise<Result<void>>;
  updateProfile(userId: string, updates: ProfileUpdate): Promise<Result<User>>;
  deleteWithRelations(userId: string): Promise<Result<void>>;
}
