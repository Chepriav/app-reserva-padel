/**
 * Human-friendly Spanish date/time for notification texts.
 * '2026-10-11' → 'domingo 11 de octubre'; '18:00:00' → '18:00'.
 */
export function formatNotificationDate(date: string | null | undefined): string {
  if (!date) return '';
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;
  return new Date(year, month - 1, day).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).replace(',', '');
}

export function formatNotificationTime(time: string | null | undefined): string {
  if (!time) return '';
  return time.split(':').slice(0, 2).join(':');
}
