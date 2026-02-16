import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { DisplacementNotificationRepository } from '@domain/ports/repositories/DisplacementNotificationRepository';
import type { DisplacementNotification } from '@domain/entities/DisplacementNotification';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import { toDomain } from '../mappers/displacementNotificationMapper';

export class SupabaseDisplacementNotificationRepository
  implements DisplacementNotificationRepository {

  async findUnreadByUser(userId: string): Promise<Result<DisplacementNotification[]>> {
    try {
      const { data, error } = await supabase
        .from('notificaciones_desplazamiento')
        .select('*')
        .eq('usuario_id', userId)
        .eq('leida', false)
        .order('created_at', { ascending: false });

      if (error) {
        // Table may not exist — degrade gracefully
        if (
          error.code === 'PGRST205' ||
          error.message?.includes('notificaciones_desplazamiento')
        ) {
          return ok([]);
        }
        return fail(new InfrastructureError('Error fetching displacement notifications', error));
      }

      return ok((data ?? []).map(toDomain));
    } catch (err) {
      return ok([]);
    }
  }

  async create(
    userId: string,
    notification: Omit<DisplacementNotification, 'id' | 'createdAt'>,
  ): Promise<Result<DisplacementNotification>> {
    try {
      const { data, error } = await supabase
        .from('notificaciones_desplazamiento')
        .insert({
          usuario_id: userId,
          fecha_reserva: notification.reservationDate,
          hora_inicio: notification.startTime,
          hora_fin: notification.endTime,
          pista_nombre: notification.courtName,
          desplazado_por_vivienda: notification.displacedByApartment,
        })
        .select()
        .single();

      if (error) {
        return fail(new InfrastructureError('Error creating displacement notification', error));
      }

      return ok(toDomain(data));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating displacement notification', err));
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('notificaciones_desplazamiento')
        .update({ leida: true })
        .eq('usuario_id', userId)
        .eq('leida', false);

      if (error) {
        if (
          error.code === 'PGRST205' ||
          error.message?.includes('notificaciones_desplazamiento')
        ) {
          return ok(undefined); // Non-existent table — treat as success
        }
        return fail(new InfrastructureError('Error marking notifications as read', error));
      }

      return ok(undefined);
    } catch (err) {
      return ok(undefined); // Non-critical operation
    }
  }
}
