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
import { SupabaseReservationRepository } from '@infrastructure/supabase/repositories/SupabaseReservationRepository';
import { SupabaseCourtRepository } from '@infrastructure/supabase/repositories/SupabaseCourtRepository';
import { SupabaseBlockoutRepository } from '@infrastructure/supabase/repositories/SupabaseBlockoutRepository';
import { SupabaseDisplacementNotificationRepository } from '@infrastructure/supabase/repositories/SupabaseDisplacementNotificationRepository';
import { LegacyDisplacementNotifierAdapter } from '@infrastructure/supabase/repositories/LegacyDisplacementNotifierAdapter';
import { LegacyMatchCancellationAdapter } from '@infrastructure/supabase/repositories/LegacyMatchCancellationAdapter';
import { GetCourts } from '@domain/useCases/GetCourts';
import { GetReservationsByApartment } from '@domain/useCases/GetReservationsByApartment';
import { GetReservationsByDate } from '@domain/useCases/GetReservationsByDate';
import { GetUserReservations } from '@domain/useCases/GetUserReservations';
import { GetAllReservations } from '@domain/useCases/GetAllReservations';
import { GetReservationStatistics } from '@domain/useCases/GetReservationStatistics';
import { GetActiveApartmentReservations } from '@domain/useCases/GetActiveApartmentReservations';
import { GetAvailability } from '@domain/useCases/GetAvailability';
import { GetBlockouts } from '@domain/useCases/GetBlockouts';
import { GetPendingDisplacementNotifications } from '@domain/useCases/GetPendingDisplacementNotifications';
import { MarkDisplacementNotificationsRead } from '@domain/useCases/MarkDisplacementNotificationsRead';
import { GetConversionInfo } from '@domain/useCases/GetConversionInfo';
import { RecalculateApartmentConversions } from '@domain/useCases/RecalculateApartmentConversions';
import { DeleteBlockout } from '@domain/useCases/DeleteBlockout';
import { CreateReservation } from '@domain/useCases/CreateReservation';
import { DisplaceReservation } from '@domain/useCases/DisplaceReservation';
import { CancelReservation } from '@domain/useCases/CancelReservation';
import { CreateBlockout } from '@domain/useCases/CreateBlockout';

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

// ---- Phase 3: Reservations ----

// Infrastructure
const reservationRepository = new SupabaseReservationRepository();
const courtRepository = new SupabaseCourtRepository();
const blockoutRepository = new SupabaseBlockoutRepository();
const displacementNotificationRepository = new SupabaseDisplacementNotificationRepository();
const displacementNotifier = new LegacyDisplacementNotifierAdapter();
const matchCancellation = new LegacyMatchCancellationAdapter();

// Query use cases
export const getCourts = new GetCourts(courtRepository);
export const getReservationsByApartment = new GetReservationsByApartment(reservationRepository);
export const getReservationsByDate = new GetReservationsByDate(reservationRepository);
export const getUserReservations = new GetUserReservations(reservationRepository);
export const getAllReservations = new GetAllReservations(reservationRepository);
export const getReservationStatistics = new GetReservationStatistics(reservationRepository);
export const getActiveApartmentReservations = new GetActiveApartmentReservations(reservationRepository);
export const getBlockouts = new GetBlockouts(blockoutRepository);
export const getPendingDisplacementNotifications = new GetPendingDisplacementNotifications(displacementNotificationRepository);
export const markDisplacementNotificationsRead = new MarkDisplacementNotificationsRead(displacementNotificationRepository);
export const getConversionInfo = new GetConversionInfo(reservationRepository);
export const recalculateApartmentConversions = new RecalculateApartmentConversions(reservationRepository);
export const deleteBlockout = new DeleteBlockout(blockoutRepository);

// Complex orchestrators (order matters: dependencies before consumers)
export const getAvailability = new GetAvailability(
  reservationRepository,
  blockoutRepository,
  scheduleConfigRepository,
  getActiveApartmentReservations,
);
export const displaceReservation = new DisplaceReservation(
  reservationRepository,
  displacementNotificationRepository,
  displacementNotifier,
  matchCancellation,
);
export const cancelReservation = new CancelReservation(reservationRepository, matchCancellation);
export const createReservation = new CreateReservation(
  reservationRepository,
  getAvailability,
  getActiveApartmentReservations,
  displaceReservation,
);
export const createBlockout = new CreateBlockout(
  blockoutRepository,
  getAvailability,
  cancelReservation,
  displacementNotifier,
);
