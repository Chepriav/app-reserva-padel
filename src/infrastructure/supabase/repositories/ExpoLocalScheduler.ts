import { Platform } from 'react-native';
import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { LocalSchedulerPort, MatchReminderIds } from '@domain/ports/repositories/LocalSchedulerPort';

/**
 * Implements local notification scheduling using Expo Notifications (mobile)
 * and webPushService.scheduleNotification (web). Device-specific — not unit-testable.
 */
export class ExpoLocalScheduler implements LocalSchedulerPort {
  async scheduleMatchReminders(
    matchId: string,
    date: string | null,
    startTime: string | null,
    courtName: string | null,
  ): Promise<Result<MatchReminderIds>> {
    const results: MatchReminderIds = { matchDayId: null, tenMinId: null };

    if (!date || !startTime) return ok(results);

    const matchDate = new Date(`${date}T${startTime}`);
    const now = new Date();

    // 1. "Match Day" notification at 09:00 on match day
    const matchDayDate = new Date(`${date}T09:00:00`);
    if (matchDayDate > now) {
      const horaFormateada = startTime.substring(0, 5);
      const courtText = courtName ? ` en ${courtName}` : '';

      if (Platform.OS === 'web') {
        try {
          const { webPushService } = await import('../../../services/webPushService');
          const delayMs = matchDayDate.getTime() - now.getTime();
          results.matchDayId = webPushService.scheduleNotification(
            '🎾 ¡Hoy es Match Day!',
            `Tienes partida a las ${horaFormateada}${courtText}`,
            delayMs,
            { type: 'partida_match_day', partidaId: matchId },
          ) as string | null;
        } catch {
          // Non-critical
        }
      } else {
        try {
          const Notifications = await import('expo-notifications');
          results.matchDayId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '🎾 ¡Hoy es Match Day!',
              body: `Tienes partida a las ${horaFormateada}${courtText}`,
              data: { type: 'partida_match_day', partidaId: matchId },
              sound: true,
            },
            trigger: { date: matchDayDate },
          });
        } catch {
          // Non-critical
        }
      }
    }

    // 2. Notification 10 minutes before
    const tenMinBefore = new Date(matchDate.getTime() - 10 * 60 * 1000);
    if (tenMinBefore > now) {
      const horaFormateada = startTime.substring(0, 5);
      const courtText = courtName ? ` en ${courtName}` : '';

      if (Platform.OS === 'web') {
        try {
          const { webPushService } = await import('../../../services/webPushService');
          const delayMs = tenMinBefore.getTime() - now.getTime();
          results.tenMinId = webPushService.scheduleNotification(
            '⏰ ¡Tu partida empieza en 10 minutos!',
            `A las ${horaFormateada}${courtText}`,
            delayMs,
            { type: 'partida_10_min', partidaId: matchId },
          ) as string | null;
        } catch {
          // Non-critical
        }
      } else {
        try {
          const Notifications = await import('expo-notifications');
          results.tenMinId = await Notifications.scheduleNotificationAsync({
            content: {
              title: '⏰ ¡Tu partida empieza en 10 minutos!',
              body: `A las ${horaFormateada}${courtText}`,
              data: { type: 'partida_10_min', partidaId: matchId },
              sound: true,
            },
            trigger: { date: tenMinBefore },
          });
        } catch {
          // Non-critical
        }
      }
    }

    return ok(results);
  }

  async cancelReminder(id: string): Promise<void> {
    if (!id) return;

    if (Platform.OS === 'web') {
      try {
        const { webPushService } = await import('../../../services/webPushService');
        webPushService.cancelScheduledNotification?.(id);
      } catch {
        // Non-critical
      }
      return;
    }

    try {
      const Notifications = await import('expo-notifications');
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // Non-critical
    }
  }
}
