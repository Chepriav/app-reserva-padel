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
      notificationService.scheduleMatchReminders?.({
        id: match.id,
        date: match.date,
        startTime: match.startTime,
        courtName: match.courtName,
      });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyJoinRequest(creatorId: string, requesterName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyMatchRequest?.(creatorId, requesterName, { matchId: matchId, isLesson: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyRequestAccepted(playerId: string, creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyMatchAceptada?.(playerId, creatorName, { matchId: matchId, isLesson: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyMatchFull(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyMatchCompleta?.(playerIds, creatorName, { matchId: matchId, isLesson: isClass });
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }

  async notifyMatchCancelled(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>> {
    try {
      const { notificationService } = await import('../../../services/notificationService');
      notificationService.notifyMatchCancelled?.(playerIds, creatorName, { matchId: matchId, isLesson: isClass });
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
      notificationService.notifyMatchCancelledByReservation?.(
        playerIds,
        creatorName,
        { date: date, startTime: startTime, isLesson: isClass },
        reason,
      );
    } catch { /* fire-and-forget */ }
    return ok(undefined);
  }
}
