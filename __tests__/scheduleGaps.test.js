import { getGapBefore } from '../src/utils/scheduleGaps';

const slots = [
  { startTime: '13:00', endTime: '13:30' },
  { startTime: '13:30', endTime: '14:00' },
  { startTime: '16:00', endTime: '16:30' },
];

describe('getGapBefore', () => {
  it('returns null for contiguous slots', () => {
    expect(getGapBefore(slots, 1)).toBeNull();
  });

  it('returns the break between non-contiguous slots', () => {
    expect(getGapBefore(slots, 2)).toEqual({ start: '14:00', end: '16:00' });
  });

  it('returns null for the first slot and invalid input', () => {
    expect(getGapBefore(slots, 0)).toBeNull();
    expect(getGapBefore(null, 1)).toBeNull();
    expect(getGapBefore(slots, 5)).toBeNull();
  });
});
