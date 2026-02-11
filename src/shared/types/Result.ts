/**
 * Application error interface.
 * All domain and infrastructure errors extend this.
 */
export interface AppError {
  code: string;
  message: string;
  cause?: unknown;
}

/**
 * Discriminated union for operation results.
 * Forces callers to check success before accessing value/error.
 */
export type Result<T, E extends AppError = AppError> =
  | { success: true; value: T }
  | { success: false; error: E };

/** Create a successful result */
export const ok = <T>(value: T): Result<T, never> => ({
  success: true,
  value,
});

/** Create a failed result */
export const fail = <E extends AppError>(error: E): Result<never, E> => ({
  success: false,
  error,
});
