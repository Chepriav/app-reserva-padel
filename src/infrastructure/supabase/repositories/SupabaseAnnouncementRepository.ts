import { supabase } from '@infrastructure/supabase/client';
import { ok, fail } from '@shared/types/Result';
import type { Result } from '@shared/types/Result';
import type { AnnouncementRepository } from '@domain/ports/repositories/AnnouncementRepository';
import type { Announcement, CreateAnnouncementData } from '@domain/entities/Announcement';
import { InfrastructureError, AnnouncementPermissionError } from '@domain/errors/DomainErrors';
import { toDomain, announcementTypeToDb, recipientsToDb } from '../mappers/announcementMapper';

export class SupabaseAnnouncementRepository implements AnnouncementRepository {
  async findForUser(userId: string): Promise<Result<Announcement[]>> {
    try {
      const now = new Date().toISOString();

      // Parallel fetch: "all" announcements + this user's recipient records
      const [allResult, recipientsResult] = await Promise.all([
        supabase
          .from('anuncios_admin')
          .select('*')
          .eq('destinatarios', 'todos')
          .gt('expira_en', now)
          .order('created_at', { ascending: false }),
        supabase
          .from('anuncios_destinatarios')
          .select('anuncio_id, leido')
          .eq('usuario_id', userId),
      ]);

      if (allResult.error && allResult.error.code !== '42P01') {
        return fail(new InfrastructureError('Error fetching announcements', allResult.error));
      }

      const readMap = new Map<string, boolean>();
      if (recipientsResult.data) {
        for (const r of recipientsResult.data as Record<string, unknown>[]) {
          readMap.set(r.anuncio_id as string, r.leido as boolean);
        }
      }

      // Fetch "selected" announcements this user is explicitly included in
      let selectedAnnouncements: Record<string, unknown>[] = [];
      if (recipientsResult.data && recipientsResult.data.length > 0) {
        const anuncioIds = (recipientsResult.data as Record<string, unknown>[]).map(
          (r) => r.anuncio_id as string,
        );
        const { data: selData } = await supabase
          .from('anuncios_admin')
          .select('*')
          .in('id', anuncioIds)
          .gt('expira_en', now)
          .order('created_at', { ascending: false });
        selectedAnnouncements = (selData ?? []) as Record<string, unknown>[];
      }

      // Merge + deduplicate + sort
      const allRows = [...(allResult.data ?? []), ...selectedAnnouncements] as Record<
        string,
        unknown
      >[];
      const unique = Array.from(new Map(allRows.map((r) => [r.id, r])).values());
      unique.sort(
        (a, b) =>
          new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime(),
      );

      return ok(unique.map((row) => toDomain(row, readMap.get(row.id as string) ?? false)));
    } catch (err) {
      return ok([]); // Non-critical path
    }
  }

  async findAll(): Promise<Result<Announcement[]>> {
    try {
      const { data, error } = await supabase
        .from('anuncios_admin')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return ok([]);
        return fail(new InfrastructureError('Error fetching announcements', error));
      }

      return ok((data ?? []).map((row) => toDomain(row as Record<string, unknown>, true)));
    } catch (err) {
      return ok([]);
    }
  }

  async create(
    data: CreateAnnouncementData,
  ): Promise<Result<{ announcement: Announcement; recipientIds: string[] }>> {
    try {
      const { data: row, error } = await supabase
        .from('anuncios_admin')
        .insert({
          creador_id: data.creatorId,
          creador_nombre: data.creatorName,
          titulo: data.title,
          mensaje: data.message,
          tipo: announcementTypeToDb(data.type ?? 'info'),
          destinatarios: recipientsToDb(data.recipients ?? 'all'),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42501') {
          return fail(new AnnouncementPermissionError('No tienes permisos para crear anuncios'));
        }
        return fail(new InfrastructureError('Error creating announcement', error));
      }

      const announcement = toDomain(row as Record<string, unknown>, false);
      const userIds = data.userIds ?? [];

      if (data.recipients === 'selected' && userIds.length > 0) {
        const recipientRows = userIds.map((userId) => ({
          anuncio_id: (row as Record<string, unknown>).id,
          usuario_id: userId,
          leido: false,
        }));
        await supabase.from('anuncios_destinatarios').insert(recipientRows);
      }

      return ok({ announcement, recipientIds: data.recipients === 'all' ? [] : userIds });
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error creating announcement', err));
    }
  }

  async markAsRead(announcementId: string, userId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('anuncios_destinatarios')
        .upsert(
          {
            anuncio_id: announcementId,
            usuario_id: userId,
            leido: true,
            leido_en: new Date().toISOString(),
          },
          { onConflict: 'anuncio_id,usuario_id' },
        );

      if (error) return fail(new InfrastructureError('Error marking announcement as read', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }

  async delete(announcementId: string): Promise<Result<void>> {
    try {
      const { error } = await supabase
        .from('anuncios_admin')
        .delete()
        .eq('id', announcementId);

      if (error) return fail(new InfrastructureError('Error deleting announcement', error));
      return ok(undefined);
    } catch (err) {
      return fail(new InfrastructureError('Unexpected error', err));
    }
  }
}
