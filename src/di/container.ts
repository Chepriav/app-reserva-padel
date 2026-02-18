/**
 * Dependency Injection container.
 * Wires infrastructure implementations to domain ports.
 * Simple factory — no DI framework needed.
 */
import { SupabaseScheduleConfigRepository } from '@infrastructure/supabase/repositories/ScheduleConfigRepository';
import { SupabaseAvatarStorage } from '@infrastructure/supabase/repositories/SupabaseAvatarStorage';
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
import { DomainMatchCancellationAdapter } from '@infrastructure/supabase/repositories/DomainMatchCancellationAdapter';
import { SupabaseMatchRepository } from '@infrastructure/supabase/repositories/SupabaseMatchRepository';
import { SupabaseUserNotificationRepository } from '@infrastructure/supabase/repositories/SupabaseUserNotificationRepository';
import { SupabaseAnnouncementRepository } from '@infrastructure/supabase/repositories/SupabaseAnnouncementRepository';
import { SupabasePlayerRepository } from '@infrastructure/supabase/repositories/SupabasePlayerRepository';
import { SupabasePushTokenRepository } from '@infrastructure/supabase/repositories/SupabasePushTokenRepository';
import { CombinedPushDelivery } from '@infrastructure/supabase/repositories/CombinedPushDelivery';
import { ExpoLocalScheduler } from '@infrastructure/supabase/repositories/ExpoLocalScheduler';
import { SupabaseDisplacementNotifier } from '@infrastructure/supabase/repositories/SupabaseDisplacementNotifier';
import { SupabaseMatchNotifier } from '@infrastructure/supabase/repositories/SupabaseMatchNotifier';
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
import { GetActiveMatches } from '@domain/useCases/GetActiveMatches';
import { GetMyMatches } from '@domain/useCases/GetMyMatches';
import { GetEnrolledMatches } from '@domain/useCases/GetEnrolledMatches';
import { GetReservationsWithMatch } from '@domain/useCases/GetReservationsWithMatch';
import { CreateMatch } from '@domain/useCases/CreateMatch';
import { EditMatch } from '@domain/useCases/EditMatch';
import { CancelMatch } from '@domain/useCases/CancelMatch';
import { DeleteMatch } from '@domain/useCases/DeleteMatch';
import { RequestToJoin } from '@domain/useCases/RequestToJoin';
import { AcceptRequest } from '@domain/useCases/AcceptRequest';
import { RejectRequest } from '@domain/useCases/RejectRequest';
import { CancelRequest } from '@domain/useCases/CancelRequest';
import { LeaveMatch } from '@domain/useCases/LeaveMatch';
import { AddPlayerToMatch } from '@domain/useCases/AddPlayerToMatch';
import { RemovePlayer } from '@domain/useCases/RemovePlayer';
import { CloseClass } from '@domain/useCases/CloseClass';
import { CancelMatchByReservation } from '@domain/useCases/CancelMatchByReservation';
import { GetUserNotifications } from '@domain/useCases/GetUserNotifications';
import { CreateUserNotification } from '@domain/useCases/CreateUserNotification';
import { MarkNotificationAsRead } from '@domain/useCases/MarkNotificationAsRead';
import { MarkAllNotificationsAsRead } from '@domain/useCases/MarkAllNotificationsAsRead';
import { DeleteUserNotification } from '@domain/useCases/DeleteUserNotification';
import { GetAnnouncementsForUser } from '@domain/useCases/GetAnnouncementsForUser';
import { MarkAnnouncementAsRead } from '@domain/useCases/MarkAnnouncementAsRead';
import { GetAllAnnouncements } from '@domain/useCases/GetAllAnnouncements';
import { CreateAnnouncement } from '@domain/useCases/CreateAnnouncement';
import { DeleteAnnouncement } from '@domain/useCases/DeleteAnnouncement';
import { SavePushToken } from '@domain/useCases/SavePushToken';
import { RemovePushToken } from '@domain/useCases/RemovePushToken';

// Repository instances
const scheduleConfigRepository = new SupabaseScheduleConfigRepository();
const avatarStorage = new SupabaseAvatarStorage();
const userRepository = new SupabaseUserRepository(avatarStorage);
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

// ---- Phase 6: Push Notifications (wired early — used by Phases 3 & 4 notifiers) ----

const pushTokenRepository = new SupabasePushTokenRepository();
const pushDelivery = new CombinedPushDelivery(pushTokenRepository);
const localScheduler = new ExpoLocalScheduler();

// ---- Phase 5: Bulletin (userNotificationRepository needed by Phase 6 notifiers) ----

const userNotificationRepository = new SupabaseUserNotificationRepository();
const announcementRepository = new SupabaseAnnouncementRepository();

export const getUserNotifications = new GetUserNotifications(userNotificationRepository);
export const createUserNotification = new CreateUserNotification(userNotificationRepository);
export const markNotificationAsRead = new MarkNotificationAsRead(userNotificationRepository);
export const markAllNotificationsAsRead = new MarkAllNotificationsAsRead(userNotificationRepository);
export const deleteUserNotification = new DeleteUserNotification(userNotificationRepository);
export const getAnnouncementsForUser = new GetAnnouncementsForUser(announcementRepository);
export const markAnnouncementAsRead = new MarkAnnouncementAsRead(announcementRepository);
export const getAllAnnouncements = new GetAllAnnouncements(announcementRepository);
export const createAnnouncement = new CreateAnnouncement(announcementRepository);
export const deleteAnnouncement = new DeleteAnnouncement(announcementRepository);

// Phase 6 notifiers (depend on userRepository from Phase 2 and createUserNotification from Phase 5)
const displacementNotifier = new SupabaseDisplacementNotifier(userRepository, createUserNotification, pushDelivery);
const matchNotifier = new SupabaseMatchNotifier(createUserNotification, pushDelivery, localScheduler);

export const savePushToken = new SavePushToken(pushTokenRepository);
export const removePushToken = new RemovePushToken(pushTokenRepository);
// Export pushDelivery for facade's direct send (notifyViviendaChange, notifyNuevoAnuncio)
export { pushDelivery };

// ---- Phase 3: Reservations ----

// Infrastructure
const reservationRepository = new SupabaseReservationRepository();
const courtRepository = new SupabaseCourtRepository();
const blockoutRepository = new SupabaseBlockoutRepository();
const displacementNotificationRepository = new SupabaseDisplacementNotificationRepository();

// ---- Phase 4: Matches ----

// Infrastructure
const matchRepository = new SupabaseMatchRepository();
const playerRepository = new SupabasePlayerRepository();

// CancelMatchByReservation must be instantiated before DomainMatchCancellationAdapter
export const cancelMatchByReservation = new CancelMatchByReservation(matchRepository, matchNotifier);
const matchCancellation = new DomainMatchCancellationAdapter(cancelMatchByReservation);

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

// Match query use cases
export const getActiveMatches = new GetActiveMatches(matchRepository);
export const getMyMatches = new GetMyMatches(matchRepository);
export const getEnrolledMatches = new GetEnrolledMatches(matchRepository);
export const getReservationsWithMatch = new GetReservationsWithMatch(matchRepository);

// Match command use cases
export const createMatch = new CreateMatch(matchRepository, matchNotifier);
export const editMatch = new EditMatch(matchRepository);
export const cancelMatch = new CancelMatch(matchRepository, matchNotifier);
export const deleteMatch = new DeleteMatch(matchRepository);
export const requestToJoin = new RequestToJoin(matchRepository, playerRepository, matchNotifier);
export const acceptRequest = new AcceptRequest(matchRepository, playerRepository, matchNotifier);
export const rejectRequest = new RejectRequest(matchRepository, playerRepository);
export const cancelRequest = new CancelRequest(playerRepository);
export const leaveMatch = new LeaveMatch(matchRepository, playerRepository);
// Export repositories for facade's direct player resolution
export { playerRepository, matchRepository };
export const addPlayerToMatch = new AddPlayerToMatch(matchRepository, playerRepository, matchNotifier);
export const removePlayer = new RemovePlayer(matchRepository, playerRepository);
export const closeClass = new CloseClass(matchRepository, matchNotifier);

