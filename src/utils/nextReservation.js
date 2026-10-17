const toDate = (date, time) => new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);

/** True when the reservation has already started (it may still be in progress). */
export const hasStarted = (reservation, now = new Date()) =>
  toDate(reservation.date, reservation.startTime) <= now;

/** Earliest confirmed reservation that hasn't finished yet (or null). */
export function pickNextReservation(reservations = [], now = new Date()) {
  return reservations
    .filter((r) => r.status === 'confirmed' && toDate(r.date, r.endTime) > now)
    .sort((a, b) => toDate(a.date, a.startTime) - toDate(b.date, b.startTime))[0] ?? null;
}
