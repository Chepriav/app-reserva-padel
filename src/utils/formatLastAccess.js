const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

const pad = (n) => String(n).padStart(2, '0');

const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/**
 * Human-readable last access for the admin user list:
 * "Hoy, 14:05" · "Ayer, 09:30" · "Hace 4 días" · "12 oct 2026" · "Sin registrar"
 */
export function formatLastAccess(isoString, now = new Date()) {
  if (!isoString) return 'Sin registrar';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'Sin registrar';

  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (days <= 0) return `Hoy, ${time}`;
  if (days === 1) return `Ayer, ${time}`;
  if (days < 7) return `Hace ${days} días`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
