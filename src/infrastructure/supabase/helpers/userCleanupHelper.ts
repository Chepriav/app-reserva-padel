import { supabase } from '../client';

/**
 * Cleans up all user-related records across tables before deletion.
 * Shared between user self-deletion and admin deletion.
 */
export async function cleanupUserRelations(
  userId: string,
  options: { removeAdminContent?: boolean } = {},
): Promise<void> {
  const { removeAdminContent = true } = options;

  // Find reservations to cascade-delete associated matches
  const { data: reservationsData } = await supabase
    .from('reservas')
    .select('id')
    .eq('usuario_id', userId);

  const reservationIds = (reservationsData || []).map((r: { id: string }) => r.id).filter(Boolean);

  if (reservationIds.length > 0) {
    await supabase.from('partidas').delete().in('reserva_id', reservationIds);
  }

  // Delete matches created by user
  await supabase.from('partidas').delete().eq('creador_id', userId);

  // Delete match participations
  await supabase.from('partidas_jugadores').delete().eq('usuario_id', userId);

  // Delete reservations
  await supabase.from('reservas').delete().eq('usuario_id', userId);

  // Clear blockout creator reference (nullify, don't delete blockouts)
  await supabase
    .from('bloqueos_horarios')
    .update({ creado_por: null })
    .eq('creado_por', userId);

  // Delete admin announcements created by user
  if (removeAdminContent) {
    await supabase.from('anuncios_admin').delete().eq('creador_id', userId);
  }

  // Delete bulletin read status
  await supabase.from('anuncios_destinatarios').delete().eq('usuario_id', userId);
}
