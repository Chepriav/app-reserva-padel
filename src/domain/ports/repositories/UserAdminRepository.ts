import type { User, ApprovalStatus } from '@domain/entities/User';
import type { Result } from '@shared/types/Result';

/**
 * Port for admin-only user management operations.
 * Implemented by infrastructure adapters (e.g., Supabase).
 */
export interface UserAdminRepository {
  findPendingUsers(): Promise<Result<User[]>>;
  findApprovedUsers(): Promise<Result<User[]>>;
  findApartmentChangeRequests(): Promise<Result<User[]>>;
  updateApprovalStatus(userId: string, status: ApprovalStatus): Promise<Result<void>>;
  toggleAdminRole(userId: string, isAdmin: boolean): Promise<Result<User>>;
  deleteUserWithRelations(userId: string): Promise<Result<void>>;
  setRequestedApartment(userId: string, apartment: string): Promise<Result<void>>;
  clearApartmentRequest(userId: string): Promise<Result<void>>;
  approveApartmentChange(userId: string): Promise<Result<void>>;
}
