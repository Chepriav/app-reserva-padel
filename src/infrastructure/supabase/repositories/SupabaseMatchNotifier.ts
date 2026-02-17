import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { MatchNotifier, MatchReminderInfo } from '@domain/ports/repositories/MatchNotifier';
import type { CreateUserNotification } from '@domain/useCases/CreateUserNotification';
import type { PushDeliveryPort } from '@domain/ports/repositories/PushDeliveryPort';
import type { LocalSchedulerPort } from '@domain/ports/repositories/LocalSchedulerPort';
import type { NotificationType } from '@domain/entities/UserNotification';

/**
 * Real implementation of MatchNotifier.
 * Replaces LegacyMatchNotifierAdapter from Phase 4.
 * Creates bulletin notifications via CreateUserNotification and
 * sends push via PushDeliveryPort. Schedules local reminders via LocalSchedulerPort.
 */
export class SupabaseMatchNotifier implements MatchNotifier {
  constructor(
    private readonly createNotification: CreateUserNotification,
    private readonly pushDelivery: PushDeliveryPort,
    private readonly localScheduler: LocalSchedulerPort,
  ) {}

  async scheduleReminders(_userId: string, match: MatchReminderInfo): Promise<Result<void>> {
    await this.localScheduler.scheduleMatchReminders(
      match.id,
      match.date,
      match.startTime,
      match.courtName,
    );
    return ok(undefined);
  }

  async notifyJoinRequest(
    creatorId: string,
    requesterName: string,
    matchId: string,
    isClass: boolean,
  ): Promise<Result<void>> {
    const tipo = isClass ? 'clase' : 'partida';
    const title = isClass ? 'Nueva solicitud de clase' : 'Nueva solicitud de partida';
    const body = `${requesterName} quiere unirse a tu ${tipo}.`;
    const type: NotificationType = isClass ? 'class_request' : 'match_request';

    await this.notify(creatorId, type, title, body, { matchId, requesterName });
    return ok(undefined);
  }

  async notifyRequestAccepted(
    playerId: string,
    creatorName: string,
    matchId: string,
    isClass: boolean,
  ): Promise<Result<void>> {
    const title = isClass ? '¡Plaza confirmada!' : 'Solicitud aceptada';
    const body = isClass
      ? `${creatorName} te ha confirmado en su clase.`
      : `${creatorName} te ha aceptado en su partida.`;
    const type: NotificationType = isClass ? 'class_accepted' : 'match_accepted';

    await this.notify(playerId, type, title, body, { matchId, creatorName });
    return ok(undefined);
  }

  async notifyMatchFull(
    playerIds: string[],
    creatorName: string,
    matchId: string,
    isClass: boolean,
  ): Promise<Result<void>> {
    const title = isClass ? '📚 ¡Grupo cerrado!' : '🎾 ¡Partida completa!';
    const body = isClass
      ? `La clase de ${creatorName} está confirmada. ¡Nos vemos en la pista!`
      : `La partida de ${creatorName} ya tiene 4 jugadores. ¡A jugar!`;
    const type: NotificationType = 'match_full';

    await Promise.allSettled(
      playerIds.map((userId) => this.notify(userId, type, title, body, { matchId, creatorName })),
    );
    return ok(undefined);
  }

  async notifyMatchCancelled(
    playerIds: string[],
    creatorName: string,
    matchId: string,
    isClass: boolean,
  ): Promise<Result<void>> {
    const tipo = isClass ? 'clase' : 'partida';
    const title = isClass ? 'Clase cancelada' : 'Partida cancelada';
    const body = `La ${tipo} de ${creatorName} ha sido cancelada.`;
    const type: NotificationType = isClass ? 'class_cancelled' : 'match_cancelled';

    await Promise.allSettled(
      playerIds.map((userId) => this.notify(userId, type, title, body, { matchId, creatorName })),
    );
    return ok(undefined);
  }

  async notifyMatchCancelledByReservation(
    playerIds: string[],
    creatorName: string,
    date: string | null,
    _startTime: string | null,
    isClass: boolean,
    reason: string,
  ): Promise<Result<void>> {
    const tipo = isClass ? 'clase' : 'partida';
    const emoji = isClass ? '📚' : '🎾';
    const title = `${emoji} ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} cancelada`;
    const body =
      reason === 'reserva_desplazada'
        ? `La reserva de la ${tipo} de ${creatorName} ha sido desplazada por otra vivienda.`
        : date
          ? `La reserva de la ${tipo} del ${date} ha sido cancelada.`
          : `La reserva de la ${tipo} de ${creatorName} ha sido cancelada.`;
    const type: NotificationType = isClass
      ? 'class_cancelled_by_reservation'
      : 'match_cancelled_by_reservation';

    await Promise.allSettled(
      playerIds.map((userId) =>
        this.notify(userId, type, title, body, { matchId: undefined, creatorName, reason }),
      ),
    );
    return ok(undefined);
  }

  private async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await Promise.allSettled([
      this.createNotification.execute({ userId, type, title, message: body, data }),
      this.pushDelivery.sendToUser(userId, title, body, data),
    ]);
  }
}
