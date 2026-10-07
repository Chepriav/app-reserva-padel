/**
 * Returns the gap between a slot and the previous one (e.g. a configured break),
 * or null when the slots are contiguous.
 */
export const getGapBefore = (slots, index) => {
  if (!slots || index <= 0 || index >= slots.length) return null;
  const prev = slots[index - 1];
  const current = slots[index];
  if (!prev?.endTime || !current?.startTime) return null;
  if (prev.endTime === current.startTime) return null;
  return { start: prev.endTime, end: current.startTime };
};
