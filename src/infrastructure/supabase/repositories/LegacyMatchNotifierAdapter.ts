import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { MatchNotifier, MatchReminderInfo } from '@domain/ports/repositories/MatchNotifier';

/**
 * Temporary adapter: wraps the legacy notificationService (not yet migrated).
 * Will be replaced with a proper implementation in Phase 6 (Push Notifications).
 */
export class LegacyMatchNotifierAdapter implements MatchNotifier {
  async scheduleReminders(userId: string, match: MatchReminderInfo): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.schedulePartidaReminders?.({
        id: match.id,
        fecha: match.date,
        horaInicio: match.startTime,
        pistaNombre: match.courtName,
      });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyJoinRequest(creatorId: string, requesterName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyPartidaSolicitud?.(creatorId, requesterName, { partidaId: matchId, esClase: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyRequestAccepted(playerId: string, creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyPartidaAceptada?.(playerId, creatorName, { partidaId: matchId, esClase: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyMatchFull(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyPartidaCompleta?.(playerIds, creatorName, { partidaId: matchId, esClase: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyMatchCancelled(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyPartidaCancelada?.(playerIds, creatorName, { partidaId: matchId, esClase: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyMatchCancelledByReservation(
    playerIds: string[],
    creatorName: string,
    date: string | null,
    startTime: string | null,
    isClass: boolean,
    reason: string,
  ): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyPartidaCanceladaPorReserva?.(
        playerIds,
        creatorName,
        { fecha: date, horaInicio: startTime, esClase: isClass },
        reason,
      );
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }
}
