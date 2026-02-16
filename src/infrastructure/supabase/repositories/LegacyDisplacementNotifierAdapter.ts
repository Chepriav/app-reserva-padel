import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { DisplacementNotifier } from '@domain/ports/repositories/DisplacementNotifier';

/**
 * Temporary adapter: wraps the legacy notificationService (not yet migrated).
 * Will be replaced with a proper implementation in Phase 6 (Push Notifications).
 */
export class LegacyDisplacementNotifierAdapter implements DisplacementNotifier {
  async notifyApartmentDisplacement(
    apartment: string,
    date: string,
    startTime: string,
    _endTime: string,
    courtName: string,
    _displacedByApartment: string,
  ): Promise<Result<void>> {
    try {
      // Lazy import to avoid bundling legacy JS in TS compilation
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyViviendaDisplacement(apartment, {
        fecha: date,
        horaInicio: startTime,
        pistaNombre: courtName,
      });
    } catch {
      // Fire-and-forget — notification failure is non-critical
    }
    return ok(undefined);
  }

  async notifyApartmentBlockoutCancellation(
    apartment: string,
    date: string,
    startTime: string,
    endTime: string,
    courtName: string,
  ): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyViviendaBlockoutCancellation?.(apartment, {
        fecha: date,
        horaInicio: startTime,
        horaFin: endTime,
        pistaNombre: courtName,
      });
    } catch {
      // Fire-and-forget
    }
    return ok(undefined);
  }
}
