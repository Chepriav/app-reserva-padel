import type { Result } from '@shared/types/Result';

export interface MatchReminderInfo {
  id: string;
  date: string | null;
  startTime: string | null;
  courtName: string | null;
}

export interface MatchNotifier {
  scheduleReminders(userId: string, match: MatchReminderInfo): Promise<Result<void>>;
  notifyJoinRequest(creatorId: string, requesterName: string, matchId: string, isClass: boolean): Promise<Result<void>>;
  notifyRequestAccepted(playerId: string, creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>>;
  notifyMatchFull(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>>;
  notifyMatchCancelled(playerIds: string[], creatorName: string, matchId: string, isClass: boolean): Promise<Result<void>>;
  notifyMatchCancelledByReservation(
    playerIds: string[],
    creatorName: string,
    date: string | null,
    startTime: string | null,
    isClass: boolean,
    reason: string,
  ): Promise<Result<void>>;
}
