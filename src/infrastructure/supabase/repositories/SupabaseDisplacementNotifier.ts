import { ok } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { DisplacementNotifier } from '@domain/ports/repositories/DisplacementNotifier';
import type { UserRepository } from '@domain/ports/repositories/UserRepository';
import type { CreateUserNotification } from '@domain/useCases/CreateUserNotification';
import type { PushDeliveryPort } from '@domain/ports/repositories/PushDeliveryPort';
import type { NotificationType } from '@domain/entities/UserNotification';

/**
 * Real implementation of DisplacementNotifier.
 * Replaces LegacyDisplacementNotifierAdapter from Phase 3.
 * Fetches apartment users via UserRepository, creates bulletin notifications,
 * and sends push via PushDeliveryPort.
 */
export class SupabaseDisplacementNotifier implements DisplacementNotifier {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly createNotification: CreateUserNotification,
    private readonly pushDelivery: PushDeliveryPort,
  ) {}

  async notifyApartmentDisplacement(
    apartment: string,
    date: string,
    startTime: string,
    _endTime: string,
    courtName: string,
    _displacedByApartment: string,
  ): Promise<Result<void>> {
    const title = 'Reserva desplazada';
    const body = `La reserva del ${date} a las ${startTime} en ${courtName} ha sido desplazada.`;

    await this.notifyApartment(apartment, 'displacement', title, body, {
      fecha: date,
      horaInicio: startTime,
      pistaNombre: courtName,
    });

    return ok(undefined);
  }

  async notifyApartmentBlockoutCancellation(
    apartment: string,
    date: string,
    startTime: string,
    _endTime: string,
    courtName: string,
  ): Promise<Result<void>> {
    const title = 'Reserva cancelada por bloqueo';
    const body = `Tu reserva del ${date} a las ${startTime} en ${courtName} ha sido cancelada por el administrador.`;

    await this.notifyApartment(apartment, 'blockout_cancellation', title, body, {
      fecha: date,
      horaInicio: startTime,
      pistaNombre: courtName,
    });

    return ok(undefined);
  }

  private async notifyApartment(
    apartment: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const usersResult = await this.userRepository.findByApartment(apartment);
    if (!usersResult.success || usersResult.value.length === 0) return;

    await Promise.allSettled(
      usersResult.value.map(async (user) => {
        await Promise.allSettled([
          this.createNotification.execute({ userId: user.id, type, title, message: body, data }),
          this.pushDelivery.sendToUser(user.id, title, body, data),
        ]);
      }),
    );
  }
}
