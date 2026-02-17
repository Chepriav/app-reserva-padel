import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { UserNotificationRepository } from '@domain/ports/repositories/UserNotificationRepository';
import type { UserNotification, CreateUserNotificationData } from '@domain/entities/UserNotification';
import { InfrastructureError } from '@domain/errors/DomainErrors';
import { toDomain, notificationTypeToDb } from '../mappers/userNotificationMapper';

export class SupabaseUserNotificationRepository implements UserNotificationRepository {
  async findByUser(userId: string): Promise<Result<UserNotification[]>> {
    try {
      const { data, error } = await supabase
        .from('notificaciones_usuario')
        .select('*')
        .eq('usuario_id', userId)
        .gt('expira_en', new Date().toISOString())
        .order('created_at', { ascending: false });

      // Graceful degradation: table may not exist in all environments
      if (error) {
        if (error.code === 'PGRST116' || error.code === '42P01') return ok([]);
        return fail(new InfrastructureError('Error fetching notifications', error));
      }

      return ok((data ?? []).map((row) => toDomain(row as Record<string, unknown>)));
    } catch (err) {
      return ok([]); // Non-critical path, return empty on unexpected error
    }
  }

  async create(data: CreateUserNotificationData): Promise<Result<UserNotification>> {
    try {
      const { data: row, error } = await supabase
        .from('notificaciones_usuario')
        .insert({
          usuario_id: data.userId,
          tipo: notificationTypeToDb(data.type),
          titulo: data.title,
          mensaje: data.message,
          datos: data.data ?? {},
        })
        .select()
        .single();

      if (error) return fail(new InfrastructureError('Error creating notification', error));
      return ok(toDomain(row as Record<string, unknown>));
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating notification', err));
    }
  }

  async markAsRead(notificationId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .update({ leida: true })
        .eq('id', notificationId);

      if (error) return fail(new InfrastructureError('Error marking notification as read', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async markAllAsRead(userId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .update({ leida: true })
        .eq('usuario_id', userId)
        .eq('leida', false);

      if (error) return fail(new InfrastructureError('Error marking all notifications as read', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async delete(notificationId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('notificaciones_usuario')
        .delete()
        .eq('id', notificationId);

      if (error) return fail(new InfrastructureError('Error deleting notification', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }
}
