import { getDisplayStatus } from '../src/utils/reservationStatus';

const now = new Date(2026, 9, 8, 12, 0); // 8 Oct 2026 12:00 local

describe('getDisplayStatus', () => {
  it('marks a confirmed reservation that already ended as completed', () => {
    expect(getDisplayStatus({ status: 'confirmed', date: '2026-10-08', endTime: '11:30:00' }, now)).toBe('completed');
    expect(getDisplayStatus({ status: 'confirmed', date: '2026-10-01', endTime: '20:00' }, now)).toBe('completed');
  });

  it('keeps upcoming or ongoing reservations as confirmed', () => {
    expect(getDisplayStatus({ status: 'confirmed', date: '2026-10-08', endTime: '12:30' }, now)).toBe('confirmed');
    expect(getDisplayStatus({ status: 'confirmed', date: '2026-10-09', endTime: '09:00' }, now)).toBe('confirmed');
  });

  it('never changes cancelled reservations', () => {
    expect(getDisplayStatus({ status: 'cancelled', date: '2026-10-01', endTime: '10:00' }, now)).toBe('cancelled');
  });
});
