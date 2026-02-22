import {
  stringToDate,
  formatDate,
  formatReadableDate,
  generateAvailableSlots,
  isFuture,
  hasSlotEnded,
  hoursUntil,
  getTodayDate,
  formatTime,
  isDateValid,
} from '../src/utils/dateHelpers';

describe('stringToDate', () => {
  test('convierte fecha y hora a Date correctamente', () => {
    const result = stringToDate('2024-06-15', '10:30');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5); // Junio es mes 5 (0-indexed)
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
  });

  test('maneja hora medianoche', () => {
    const result = stringToDate('2024-01-01', '00:00');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
  });

  test('maneja última hora del día', () => {
    const result = stringToDate('2024-12-31', '23:59');
    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
  });
});

describe('formatDate', () => {
  test('formatea fecha a YYYY-MM-DD', () => {
    const date = new Date(2024, 5, 15); // 15 de Junio 2024
    expect(formatDate(date)).toBe('2024-06-15');
  });

  test('añade padding a mes y día', () => {
    const date = new Date(2024, 0, 5); // 5 de Enero 2024
    expect(formatDate(date)).toBe('2024-01-05');
  });

  test('maneja fin de año', () => {
    const date = new Date(2024, 11, 31); // 31 de Diciembre 2024
    expect(formatDate(date)).toBe('2024-12-31');
  });
});

describe('formatReadableDate', () => {
  test('formatea string de fecha correctamente', () => {
    const result = formatReadableDate('2024-06-15');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('junio');
  });

  test('maneja fecha null', () => {
    expect(formatReadableDate(null)).toBe('Fecha no disponible');
  });

  test('maneja fecha undefined', () => {
    expect(formatReadableDate(undefined)).toBe('Fecha no disponible');
  });

  test('maneja objeto Date', () => {
    const date = new Date(2024, 5, 15);
    const result = formatReadableDate(date);
    expect(result).toContain('2024');
  });

  test('maneja Firebase Timestamp', () => {
    const mockTimestamp = {
      toDate: () => new Date(2024, 5, 15),
    };
    const result = formatReadableDate(mockTimestamp);
    expect(result).toContain('2024');
  });

  test('retorna mensaje para tipo inválido', () => {
    expect(formatReadableDate(12345)).toBe('Fecha inválida');
    expect(formatReadableDate({})).toBe('Fecha inválida');
  });
});

describe('generateAvailableSlots', () => {
  test('genera array de slots', () => {
    const slots = generateAvailableSlots();
    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });

  test('cada slot tiene startTime y endTime', () => {
    const slots = generateAvailableSlots();
    slots.forEach((slot) => {
      expect(slot).toHaveProperty('startTime');
      expect(slot).toHaveProperty('endTime');
      expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
      expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  test('primer slot comienza a las 08:00', () => {
    const slots = generateAvailableSlots();
    expect(slots[0].startTime).toBe('08:00');
  });

  test('último slot no excede hora de cierre', () => {
    const slots = generateAvailableSlots();
    const lastSlot = slots[slots.length - 1];
    const [endHour] = lastSlot.endTime.split(':').map(Number);
    expect(endHour).toBeLessThanOrEqual(22);
  });
});

describe('isFuture', () => {
  test('retorna true para fecha futura', () => {
    const futureDate = getFutureDate(1);
    expect(isFuture(futureDate, '12:00')).toBe(true);
  });

  test('retorna false para fecha pasada', () => {
    expect(isFuture('2020-01-01', '10:00')).toBe(false);
  });

  test('retorna false para hora pasada del día actual', () => {
    const today = formatDate(new Date());
    expect(isFuture(today, '00:01')).toBe(false);
  });
});

describe('hoursUntil', () => {
  test('retorna número negativo para fecha pasada', () => {
    const result = hoursUntil('2020-01-01', '10:00');
    expect(result).toBeLessThan(0);
  });

  test('retorna número positivo para fecha futura', () => {
    const futureDate = getFutureDate(1);
    const result = hoursUntil(futureDate, '12:00');
    expect(result).toBeGreaterThan(0);
  });

  test('fecha mañana a misma hora es aproximadamente 24 horas', () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = formatDate(tomorrow);
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const result = hoursUntil(tomorrowDate, currentTime);
    expect(result).toBeGreaterThan(23);
    expect(result).toBeLessThan(25);
  });
});

describe('getTodayDate', () => {
  test('retorna fecha en formato YYYY-MM-DD', () => {
    const result = getTodayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('retorna fecha de hoy', () => {
    const result = getTodayDate();
    const today = new Date();
    const expected = formatDate(today);
    expect(result).toBe(expected);
  });
});

describe('isDateValid', () => {
  test('acepta fecha de hoy', () => {
    const today = formatDate(new Date());
    expect(isDateValid(today)).toBe(true);
  });

  test('acepta fecha dentro de 7 días', () => {
    const date = getFutureDate(5);
    expect(isDateValid(date)).toBe(true);
  });

  test('acepta fecha exactamente en 7 días', () => {
    const date = getFutureDate(7);
    expect(isDateValid(date)).toBe(true);
  });

  test('rechaza fecha pasada', () => {
    expect(isDateValid('2020-01-01')).toBe(false);
  });

  test('rechaza fecha más de 7 días en el futuro', () => {
    const date = getFutureDate(10);
    expect(isDateValid(date)).toBe(false);
  });
});

describe('formatReadableDate — ISO timestamp', () => {
  test('parsea string con T (ISO timestamp)', () => {
    const result = formatReadableDate('2024-06-15T10:30:00Z');
    expect(result).toContain('2024');
  });

  test('retorna "Fecha inválida" para fecha inválida parseable', () => {
    // NaN date from invalid ISO
    const result = formatReadableDate('invalid-date-T');
    expect(result).toBe('Fecha inválida');
  });
});

describe('generateAvailableSlots — differentiated schedules', () => {
  test('genera slots de semana con horario diferenciado', () => {
    // A Monday date
    const monday = '2026-02-23';
    const config = {
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: '09:00',
      weekdayClosingTime: '21:00',
      weekendOpeningTime: '08:00',
      weekendClosingTime: '22:00',
      slotDuration: 30,
    };
    const slots = generateAvailableSlots(config, monday);
    expect(slots[0].startTime).toBe('09:00');
  });

  test('genera slots de fin de semana con horario diferenciado', () => {
    // A Saturday date
    const saturday = '2026-02-28';
    const config = {
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: '09:00',
      weekdayClosingTime: '21:00',
      weekendOpeningTime: '08:00',
      weekendClosingTime: '22:00',
      slotDuration: 30,
    };
    const slots = generateAvailableSlots(config, saturday);
    expect(slots[0].startTime).toBe('08:00');
  });

  test('omite slots dentro del horario de descanso', () => {
    const config = {
      useDifferentiatedSchedules: false,
      openingTime: '08:00',
      closingTime: '22:00',
      slotDuration: 30,
      breakStart: '13:00',
      breakEnd: '14:00',
    };
    const slots = generateAvailableSlots(config, '2026-02-23');
    const hasBreakSlot = slots.some(
      (s) => s.startTime >= '13:00' && s.startTime < '14:00',
    );
    expect(hasBreakSlot).toBe(false);
  });

  test('omite slots de descanso solo en días indicados por breakWeekdays', () => {
    // Only skip break on Monday (dayOfWeek=1)
    const monday = '2026-02-23';
    const saturday = '2026-02-28';
    const config = {
      useDifferentiatedSchedules: false,
      openingTime: '08:00',
      closingTime: '22:00',
      slotDuration: 30,
      breakStart: '13:00',
      breakEnd: '14:00',
      breakWeekdays: [1], // only Monday
    };
    const mondaySlots = generateAvailableSlots(config, monday);
    const saturdaySlots = generateAvailableSlots(config, saturday);

    const mondayHasBreak = mondaySlots.some(
      (s) => s.startTime >= '13:00' && s.startTime < '14:00',
    );
    const saturdayHasBreak = saturdaySlots.some(
      (s) => s.startTime >= '13:00' && s.startTime < '14:00',
    );
    expect(mondayHasBreak).toBe(false);
    expect(saturdayHasBreak).toBe(true);
  });

  test('descanso en fin de semana con horario diferenciado', () => {
    const saturday = '2026-02-28';
    const config = {
      useDifferentiatedSchedules: true,
      weekdayOpeningTime: '09:00',
      weekdayClosingTime: '21:00',
      weekendOpeningTime: '08:00',
      weekendClosingTime: '22:00',
      slotDuration: 30,
      weekendBreakStart: '14:00',
      weekendBreakEnd: '15:00',
    };
    const slots = generateAvailableSlots(config, saturday);
    const hasBreak = slots.some(
      (s) => s.startTime >= '14:00' && s.startTime < '15:00',
    );
    expect(hasBreak).toBe(false);
  });
});

describe('hasSlotEnded', () => {
  test('retorna true cuando el slot ya terminó (endTime en el pasado)', () => {
    expect(hasSlotEnded('2020-01-01', '10:00')).toBe(true);
  });

  test('retorna false cuando el slot aún no termina (endTime en el futuro)', () => {
    const futureDate = getFutureDate(1);
    expect(hasSlotEnded(futureDate, '23:59')).toBe(false);
  });
});

describe('formatTime', () => {
  test('devuelve vacío para valor falsy', () => {
    expect(formatTime(null)).toBe('');
    expect(formatTime(undefined)).toBe('');
    expect(formatTime('')).toBe('');
  });

  test('mantiene formato HH:MM sin cambios', () => {
    expect(formatTime('10:30')).toBe('10:30');
  });

  test('elimina los segundos de formato HH:MM:SS', () => {
    expect(formatTime('10:30:00')).toBe('10:30');
    expect(formatTime('08:00:45')).toBe('08:00');
  });
});

// Helper para generar fechas futuras
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}
