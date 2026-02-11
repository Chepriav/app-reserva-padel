/**
 * Dependency Injection container.
 * Wires infrastructure implementations to domain ports.
 * Simple factory — no DI framework needed.
 */
import { SupabaseScheduleConfigRepository } from '@infrastructure/supabase/repositories/ScheduleConfigRepository';
import { SupabaseUserRepository } from '@infrastructure/supabase/repositories/SupabaseUserRepository';
import { SupabaseUserAdminRepository } from '@infrastructure/supabase/repositories/SupabaseUserAdminRepository';
import { SupabaseAuthProvider } from '@infrastructure/supabase/repositories/SupabaseAuthProvider';
import { GetScheduleConfig } from '@domain/useCases/GetScheduleConfig';
import { UpdateScheduleConfig } from '@domain/useCases/UpdateScheduleConfig';
import { CheckSlotInBreakTime } from '@domain/useCases/CheckSlotInBreakTime';
import { LoginUser } from '@domain/useCases/LoginUser';
import { RegisterUser } from '@domain/useCases/RegisterUser';
import { LogoutUser } from '@domain/useCases/LogoutUser';
import { ResetPassword } from '@domain/useCases/ResetPassword';
import { UpdatePassword } from '@domain/useCases/UpdatePassword';
import { GetCurrentUser } from '@domain/useCases/GetCurrentUser';
import { UpdateProfile } from '@domain/useCases/UpdateProfile';
import { DeleteOwnAccount } from '@domain/useCases/DeleteOwnAccount';
import { GetApartmentUsers } from '@domain/useCases/GetApartmentUsers';
import { GetPendingUsers } from '@domain/useCases/GetPendingUsers';
import { GetAllApprovedUsers } from '@domain/useCases/GetAllApprovedUsers';
import { ApproveUser } from '@domain/useCases/ApproveUser';
import { RejectUser } from '@domain/useCases/RejectUser';
import { ToggleAdminRole } from '@domain/useCases/ToggleAdminRole';
import { DeleteUser } from '@domain/useCases/DeleteUser';

// Repository instances
const scheduleConfigRepository = new SupabaseScheduleConfigRepository();
const userRepository = new SupabaseUserRepository();
const userAdminRepository = new SupabaseUserAdminRepository();
const authProvider = new SupabaseAuthProvider();

// Schedule config use cases
export const getScheduleConfig = new GetScheduleConfig(scheduleConfigRepository);
export const updateScheduleConfig = new UpdateScheduleConfig(scheduleConfigRepository);
export const checkSlotInBreakTime = new CheckSlotInBreakTime();

// Auth use cases
export const loginUser = new LoginUser(authProvider, userRepository);
export const registerUser = new RegisterUser(authProvider, userRepository);
export const logoutUser = new LogoutUser(authProvider);
export const resetPasswordUseCase = new ResetPassword(authProvider);
export const updatePasswordUseCase = new UpdatePassword(authProvider);

// User profile use cases
export const getCurrentUser = new GetCurrentUser(authProvider, userRepository);
export const updateProfile = new UpdateProfile(userRepository);
export const deleteOwnAccount = new DeleteOwnAccount(userRepository, authProvider);
export const getApartmentUsers = new GetApartmentUsers(userRepository);

// Admin user management use cases
export const getPendingUsers = new GetPendingUsers(userAdminRepository);
export const getAllApprovedUsers = new GetAllApprovedUsers(userAdminRepository);
export const approveUser = new ApproveUser(userAdminRepository);
export const rejectUser = new RejectUser(userAdminRepository);
export const toggleAdminRole = new ToggleAdminRole(userAdminRepository);
export const deleteUser = new DeleteUser(userAdminRepository);

// Export repository for facade's direct apartment operations
export { userAdminRepository };
