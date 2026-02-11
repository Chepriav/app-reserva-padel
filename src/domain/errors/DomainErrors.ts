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
