/**
 * Status to show in logs: the DB never marks reservations as completed,
 * so a confirmed reservation whose end time has passed is shown as 'completed'.
 */
export const getDisplayStatus = (reservation, now = new Date()) => {
  if (reservation?.status !== 'confirmed') return reservation?.status;
  if (!reservation.date || !reservation.endTime) return 'confirmed';

  const [year, month, day] = reservation.date.split('-').map(Number);
  const [hours, minutes] = reservation.endTime.split(':').map(Number);
  const end = new Date(year, month - 1, day, hours, minutes);
  return end <= now ? 'completed' : 'confirmed';
};
