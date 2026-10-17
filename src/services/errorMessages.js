// Spanish user-facing messages for domain error codes.
// Domain/infrastructure messages are English and technical, so they are never shown as-is.
const ERROR_MESSAGES = {
  INFRASTRUCTURE_ERROR: 'No se ha podido conectar con el servidor. Inténtalo de nuevo en unos segundos.',
  VALIDATION_ERROR: 'Revisa los datos introducidos.',
  SCHEDULE_CONFIG_NOT_FOUND: 'No se encontró la configuración de horarios.',
  SCHEDULE_CONFIG_UPDATE_ERROR: 'No se pudo guardar la configuración de horarios.',
  USER_NOT_FOUND: 'Usuario no encontrado.',
  USER_NOT_APPROVED: 'Tu cuenta está pendiente de aprobación.',
  AUTHENTICATION_ERROR: 'No se pudo completar la operación. Inicia sesión de nuevo.',
  PROFILE_UPDATE_ERROR: 'No se pudo actualizar el perfil.',
  RESERVATION_NOT_FOUND: 'Reserva no encontrada.',
  RESERVATION_ALREADY_CANCELLED: 'Esta reserva ya fue cancelada.',
  RESERVATION_PERMISSION_ERROR: 'No tienes permisos para esta operación.',
  RESERVATION_LIMIT_EXCEEDED: 'Tu vivienda ya tiene una reserva activa. Cancélala para hacer otra.',
  RESERVATION_SLOT_UNAVAILABLE: 'El horario seleccionado ya no está disponible.',
  RESERVATION_TOO_EARLY: 'Ese horario ya ha pasado. Elige otro.',
  RESERVATION_TOO_FAR_AHEAD: 'Solo se puede reservar con 7 días de antelación como máximo.',
  DISPLACEMENT_REQUIRED: 'Este horario tiene una reserva provisional que será desplazada.',
  DISPLACEMENT_FAILED: 'No se pudo desplazar la reserva provisional.',
  COURT_NOT_FOUND: 'Pista no encontrada.',
  BLOCKOUT_CONFLICT: 'Este horario ya está bloqueado.',
  BLOCKOUT_NOT_FOUND: 'Bloqueo no encontrado.',
  RPC_NOT_FOUND: 'No se ha podido conectar con el servidor. Inténtalo de nuevo en unos segundos.',
  MATCH_NOT_FOUND: 'Partida no encontrada.',
  MATCH_PERMISSION_ERROR: 'Solo el organizador puede hacer esto.',
  MATCH_ALREADY_CANCELLED: 'La partida ya está cancelada.',
  PLAYER_ALREADY_JOINED: 'Ya tienes una solicitud o estás apuntado a esta partida.',
  MATCH_FULL: 'La partida ya está completa.',
  NOTIFICATION_NOT_FOUND: 'Notificación no encontrada.',
  ANNOUNCEMENT_NOT_FOUND: 'Anuncio no encontrado.',
  ANNOUNCEMENT_PERMISSION: 'No tienes permisos para gestionar anuncios.',
};

export const NETWORK_ERROR_MESSAGE =
  'Sin conexión a internet. Comprueba tu conexión e inténtalo de nuevo.';

/** True when the failure comes from having no connection (browser offline or fetch failed) */
export function isNetworkError(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const text = [error?.message, error?.cause?.message, error?.cause?.cause?.message]
    .filter((m) => typeof m === 'string')
    .join(' ');
  return /failed to fetch|network ?request failed|networkerror|load failed|fetch failed|internet/i.test(text);
}

/** Spanish message for a domain error; falls back to a generic message, never to the raw one */
export function translateError(error, fallback = 'Algo ha fallado. Inténtalo de nuevo en unos segundos.') {
  if (isNetworkError(error)) return NETWORK_ERROR_MESSAGE;
  return ERROR_MESSAGES[error?.code] ?? fallback;
}
