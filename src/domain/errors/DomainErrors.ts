import { AppError } from '@shared/types/Result';

export class InfrastructureError implements AppError {
  readonly code = 'INFRASTRUCTURE_ERROR';
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class ScheduleConfigNotFoundError implements AppError {
  readonly code = 'SCHEDULE_CONFIG_NOT_FOUND';
  readonly message = 'Schedule configuration not found';
}

export class ScheduleConfigUpdateError implements AppError {
  readonly code = 'SCHEDULE_CONFIG_UPDATE_ERROR';
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class ValidationError implements AppError {
  readonly code = 'VALIDATION_ERROR';
  constructor(public readonly message: string) {}
}

export class UserNotFoundError implements AppError {
  readonly code = 'USER_NOT_FOUND';
  readonly message = 'User not found';
}

export class UserNotApprovedError implements AppError {
  readonly code = 'USER_NOT_APPROVED';
  constructor(public readonly message: string) {}
}

export class AuthenticationError implements AppError {
  readonly code = 'AUTHENTICATION_ERROR';
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class ProfileUpdateError implements AppError {
  readonly code = 'PROFILE_UPDATE_ERROR';
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

// --- Reservation errors ---

export class ReservationNotFoundError implements AppError {
  readonly code = 'RESERVATION_NOT_FOUND';
  readonly message = 'Reservation not found';
}

export class ReservationAlreadyCancelledError implements AppError {
  readonly code = 'RESERVATION_ALREADY_CANCELLED';
  readonly message = 'Reservation is already cancelled';
}

export class ReservationPermissionError implements AppError {
  readonly code = 'RESERVATION_PERMISSION_ERROR';
  constructor(public readonly message: string) {}
}

export class ReservationLimitExceededError implements AppError {
  readonly code = 'RESERVATION_LIMIT_EXCEEDED';
  constructor(public readonly message: string) {}
}

export class ReservationSlotUnavailableError implements AppError {
  readonly code = 'RESERVATION_SLOT_UNAVAILABLE';
  constructor(public readonly message: string) {}
}

export class ReservationTooEarlyError implements AppError {
  readonly code = 'RESERVATION_TOO_EARLY';
  constructor(public readonly message: string) {}
}

export class ReservationTooFarAheadError implements AppError {
  readonly code = 'RESERVATION_TOO_FAR_AHEAD';
  constructor(public readonly message: string) {}
}

export class DisplacementRequiredError implements AppError {
  readonly code = 'DISPLACEMENT_REQUIRED';
  readonly message = 'Displacement confirmation required';
  constructor(public readonly reservationToDisplace: import('@domain/entities/Reservation').Reservation) {}
}

export class DisplacementFailedError implements AppError {
  readonly code = 'DISPLACEMENT_FAILED';
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class CourtNotFoundError implements AppError {
  readonly code = 'COURT_NOT_FOUND';
  readonly message = 'Court not found';
}

export class BlockoutConflictError implements AppError {
  readonly code = 'BLOCKOUT_CONFLICT';
  readonly message = 'Blockout conflicts with an existing record';
}

export class BlockoutNotFoundError implements AppError {
  readonly code = 'BLOCKOUT_NOT_FOUND';
  readonly message = 'Blockout not found';
}

export class RpcNotFoundError implements AppError {
  readonly code = 'RPC_NOT_FOUND';
  readonly message = 'RPC function not available, fallback required';
}
