import {
  stringToDate,
  formatearFecha,
  formatearFechaLegible,
  generarHorariosDisponibles,
  esFuturo,
  horasHasta,
  obtenerFechaHoy,
  esFechaValida,
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

describe('formatearFecha', () => {
  test('formatea fecha a YYYY-MM-DD', () => {
    const date = new Date(2024, 5, 15); // 15 de Junio 2024
    expect(formatearFecha(date)).toBe('2024-06-15');
  });

  test('añade padding a mes y día', () => {
    const date = new Date(2024, 0, 5); // 5 de Enero 2024
    expect(formatearFecha(date)).toBe('2024-01-05');
  });

  test('maneja fin de año', () => {
    const date = new Date(2024, 11, 31); // 31 de Diciembre 2024
    expect(formatearFecha(date)).toBe('2024-12-31');
  });
});

describe('formatearFechaLegible', () => {
  test('formatea string de fecha correctamente', () => {
    const result = formatearFechaLegible('2024-06-15');
    expect(result).toContain('2024');
    expect(result.toLowerCase()).toContain('junio');
  });

  test('maneja fecha null', () => {
    expect(formatearFechaLegible(null)).toBe('Fecha no disponible');
  });

  test('maneja fecha undefined', () => {
    expect(formatearFechaLegible(undefined)).toBe('Fecha no disponible');
  });

  test('maneja objeto Date', () => {
    const date = new Date(2024, 5, 15);
    const result = formatearFechaLegible(date);
    expect(result).toContain('2024');
  });

  test('maneja Firebase Timestamp', () => {
    const mockTimestamp = {
      toDate: () => new Date(2024, 5, 15),
    };
    const result = formatearFechaLegible(mockTimestamp);
    expect(result).toContain('2024');
  });

  test('retorna mensaje para tipo inválido', () => {
    expect(formatearFechaLegible(12345)).toBe('Fecha inválida');
    expect(formatearFechaLegible({})).toBe('Fecha inválida');
  });
});

describe('generarHorariosDisponibles', () => {
  test('genera array de horarios', () => {
    const horarios = generarHorariosDisponibles();
    expect(Array.isArray(horarios)).toBe(true);
    expect(horarios.length).toBeGreaterThan(0);
  });

  test('cada horario tiene horaInicio y horaFin', () => {
    const horarios = generarHorariosDisponibles();
    horarios.forEach((horario) => {
      expect(horario).toHaveProperty('horaInicio');
      expect(horario).toHaveProperty('horaFin');
      expect(horario.horaInicio).toMatch(/^\d{2}:\d{2}$/);
      expect(horario.horaFin).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  test('primer horario comienza a las 08:00', () => {
    const horarios = generarHorariosDisponibles();
    expect(horarios[0].horaInicio).toBe('08:00');
  });

  test('último horario no excede hora de cierre', () => {
    const horarios = generarHorariosDisponibles();
    const ultimoHorario = horarios[horarios.length - 1];
    const [horaFin] = ultimoHorario.horaFin.split(':').map(Number);
    expect(horaFin).toBeLessThanOrEqual(22);
  });
});

describe('esFuturo', () => {
  test('retorna true para fecha futura', () => {
    const fechaFutura = getFutureDate(1);
    expect(esFuturo(fechaFutura, '12:00')).toBe(true);
  });

  test('retorna false para fecha pasada', () => {
    expect(esFuturo('2020-01-01', '10:00')).toBe(false);
  });

  test('retorna false para hora pasada del día actual', () => {
    const hoy = formatearFecha(new Date());
    expect(esFuturo(hoy, '00:01')).toBe(false);
  });
});

describe('horasHasta', () => {
  test('retorna número negativo para fecha pasada', () => {
    const result = horasHasta('2020-01-01', '10:00');
    expect(result).toBeLessThan(0);
  });

  test('retorna número positivo para fecha futura', () => {
    const fechaFutura = getFutureDate(1);
    const result = horasHasta(fechaFutura, '12:00');
    expect(result).toBeGreaterThan(0);
  });

  test('fecha mañana a misma hora es aproximadamente 24 horas', () => {
    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setDate(manana.getDate() + 1);
    const fechaManana = formatearFecha(manana);
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;

    const result = horasHasta(fechaManana, horaActual);
    expect(result).toBeGreaterThan(23);
    expect(result).toBeLessThan(25);
  });
});

describe('obtenerFechaHoy', () => {
  test('retorna fecha en formato YYYY-MM-DD', () => {
    const result = obtenerFechaHoy();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('retorna fecha de hoy', () => {
    const result = obtenerFechaHoy();
    const hoy = new Date();
    const expected = formatearFecha(hoy);
    expect(result).toBe(expected);
  });
});

describe('esFechaValida', () => {
  test('acepta fecha de hoy', () => {
    const hoy = formatearFecha(new Date());
    expect(esFechaValida(hoy)).toBe(true);
  });

  test('acepta fecha dentro de 7 días', () => {
    const fecha = getFutureDate(5);
    expect(esFechaValida(fecha)).toBe(true);
  });

  test('acepta fecha exactamente en 7 días', () => {
    const fecha = getFutureDate(7);
    expect(esFechaValida(fecha)).toBe(true);
  });

  test('rechaza fecha pasada', () => {
    expect(esFechaValida('2020-01-01')).toBe(false);
  });

  test('rechaza fecha más de 7 días en el futuro', () => {
    const fecha = getFutureDate(10);
    expect(esFechaValida(fecha)).toBe(false);
  });
});

// Helper para generar fechas futuras
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return formatearFecha(date);
}
