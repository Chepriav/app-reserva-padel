/**
 * Unit tests for TimeSlotChip — apartment display logic
 *
 * Tests the `showApartment` computation as a pure function,
 * matching the project's pattern of testing logic without a React renderer
 * (react-test-renderer version conflict with @testing-library/react-native).
 *
 * Rule: show apartment iff existingReservation.apartment exists
 * AND the slot is not in any active selection state.
 */

// ─── Pure logic extracted from TimeSlotChip ──────────────────────────────────

/**
 * Mirrors the showApartment calculation inside TimeSlotChip
 */
function calcShowApartment({ existingReservation, estaSelected, isSelectedForBlock, isSelectedForUnblock }) {
  const apartment = existingReservation?.apartment;
  return !!apartment && !estaSelected && !isSelectedForBlock && !isSelectedForUnblock;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const makeReservation = (apartment = '3-2-A', priority = 'guaranteed') => ({
  id: 'res-1',
  userId: 'u-1',
  userName: 'Ana García',
  apartment,
  priority,
  date: '2099-12-31',
  startTime: '09:00',
  endTime: '09:30',
});

const base = {
  estaSelected: false,
  isSelectedForBlock: false,
  isSelectedForUnblock: false,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('TimeSlotChip — showApartment logic', () => {
  describe('shows apartment when slot is reserved', () => {
    it('guaranteed reservation', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: makeReservation('3-2-A', 'guaranteed'),
      })).toBe(true);
    });

    it('provisional reservation', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: makeReservation('5-5-H', 'provisional'),
      })).toBe(true);
    });

    it('own apartment reservation', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: makeReservation('1-1-A', 'guaranteed'),
      })).toBe(true);
    });

    it('apartment with longer code (10-3-AB)', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: makeReservation('10-3-AB', 'guaranteed'),
      })).toBe(true);
    });
  });

  describe('does NOT show apartment when slot has no reservation', () => {
    it('free slot (no existingReservation)', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: null,
      })).toBe(false);
    });

    it('blocked slot (no existingReservation)', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: null,
      })).toBe(false);
    });
  });

  describe('does NOT show apartment during selection states', () => {
    it('estaSelected = true (slot selected for reservation)', () => {
      expect(calcShowApartment({
        ...base,
        estaSelected: true,
        existingReservation: makeReservation('3-2-A'),
      })).toBe(false);
    });

    it('isSelectedForBlock = true (admin blocking)', () => {
      expect(calcShowApartment({
        ...base,
        isSelectedForBlock: true,
        existingReservation: makeReservation('3-2-A'),
      })).toBe(false);
    });

    it('isSelectedForUnblock = true (admin unblocking)', () => {
      expect(calcShowApartment({
        ...base,
        isSelectedForUnblock: true,
        existingReservation: makeReservation('3-2-A'),
      })).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('existingReservation with empty apartment string → treated as no apartment', () => {
      expect(calcShowApartment({
        ...base,
        existingReservation: makeReservation(''),
      })).toBe(false);
    });

    it('all selection flags true simultaneously → hidden', () => {
      expect(calcShowApartment({
        estaSelected: true,
        isSelectedForBlock: true,
        isSelectedForUnblock: true,
        existingReservation: makeReservation('3-2-A'),
      })).toBe(false);
    });
  });
});
