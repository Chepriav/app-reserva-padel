import type { Result } from '@shared/types/Result';

export interface MatchReminderIds {
  matchDayId: string | null;
  tenMinId: string | null;
}

export interface LocalSchedulerPort {
  scheduleMatchReminders(
    matchId: string,
    date: string | null,
    startTime: string | null,
    courtName: string | null,
  ): Promise<Result<MatchReminderIds>>;

  cancelReminder(id: string): Promise<void>;
}
