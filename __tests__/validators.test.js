import {
  validarEmail,
  validarTelefono,
  puedeReservar,
  puedeCancelar,
  validarRegistro,
  validarPerfil,
} from '../src/utils/validators';

describe('validarEmail', () => {
  test('acepta emails válidos', () => {
    expect(validarEmail('user@example.com')).toBe(true);
    expect(validarEmail('test.user@domain.es')).toBe(true);
    expect(validarEmail('user+tag@example.org')).toBe(true);
  });

  test('rechaza emails inválidos', () => {
    expect(validarEmail('')).toBe(false);
    expect(validarEmail('invalid')).toBe(false);
    expect(validarEmail('missing@domain')).toBe(false);
    expect(validarEmail('@nodomain.com')).toBe(false);
    expect(validarEmail('spaces in@email.com')).toBe(false);
  });
});

describe('validarTelefono', () => {
  test('acepta teléfonos válidos', () => {
    expect(validarTelefono('612345678')).toBe(true);
    expect(validarTelefono('912345678')).toBe(true);
    expect(validarTelefono('+34612345678')).toBe(true);
    expect(validarTelefono('612 345 678')).toBe(true);
    expect(validarTelefono('612-345-678')).toBe(true);
  });

  test('rechaza teléfonos inválidos', () => {
    expect(validarTelefono('12345')).toBe(false);
    expect(validarTelefono('abcdefghi')).toBe(false);
    expect(validarTelefono('')).toBe(false);
  });
});

describe('puedeReservar', () => {
  const usuario = { id: 'user1', nombre: 'Test User' };

  test('permite reservar sin reservas previas', () => {
    const nuevaReserva = {
      fecha: getFutureDate(1),
      horaInicio: '10:00',
      pistaId: 'pista1',
    };

    const result = puedeReservar(usuario, nuevaReserva, []);
    expect(result.valido).toBe(true);
  });

  test('rechaza reservar en horarios pasados', () => {
    const nuevaReserva = {
      fecha: '2020-01-01',
      horaInicio: '10:00',
      pistaId: 'pista1',
    };

    const result = puedeReservar(usuario, nuevaReserva, []);
    expect(result.valido).toBe(false);
    expect(result.error).toContain('pasados');
  });

  test('rechaza si ya tiene 1 reserva activa', () => {
    const reservasActuales = [
      { id: '1', usuarioId: 'user1', estado: 'confirmada', vivienda: '1-3-B', fecha: getFutureDate(2), horaInicio: '10:00', horaFin: '11:00' },
    ];
    const nuevaReserva = {
      fecha: getFutureDate(3),
      horaInicio: '14:00',
      pistaId: 'pista1',
    };

    const result = puedeReservar(usuario, nuevaReserva, reservasActuales);
    expect(result.valido).toBe(false);
    expect(result.error).toContain('1 reserva');
  });

  test('rechaza si ya tiene reserva a la misma hora', () => {
    const fechaFutura = getFutureDate(1);
    const reservasActuales = [
      { id: '1', usuarioId: 'user1', estado: 'confirmada', fecha: fechaFutura, horaInicio: '10:00' },
    ];
    const nuevaReserva = {
      fecha: fechaFutura,
      horaInicio: '10:00',
      pistaId: 'pista2',
    };

    const result = puedeReservar(usuario, nuevaReserva, reservasActuales);
    expect(result.valido).toBe(false);
    expect(result.error).toContain('esta hora');
  });
});

describe('puedeCancelar', () => {
  test('permite cancelar con más de 1.5 horas de anticipación', () => {
    const reserva = {
      fecha: getFutureDate(1),
      horaInicio: '10:00',
    };

    const result = puedeCancelar(reserva);
    expect(result.valido).toBe(true);
  });

  test('permite cancelación en cualquier momento (incluso inmediata)', () => {
    const ahora = new Date();
    const fecha = ahora.toISOString().split('T')[0];
    const horaActual = ahora.getHours();
    // Reserva en 30 minutos (antes era rechazada)
    const minutosReserva = ahora.getMinutes() + 30;
    const horaReserva = minutosReserva >= 60
      ? `${String(horaActual + 1).padStart(2, '0')}:${String(minutosReserva - 60).padStart(2, '0')}`
      : `${String(horaActual).padStart(2, '0')}:${String(minutosReserva).padStart(2, '0')}`;

    const reserva = { fecha, horaInicio: horaReserva };

    const result = puedeCancelar(reserva);
    // Now should allow cancellation at any time
    expect(result.valido).toBe(true);
  });
});

describe('validarRegistro', () => {
  test('acepta datos de registro válidos', () => {
    const datos = {
      nombre: 'Juan García',
      email: 'juan@example.com',
      telefono: '612345678',
      vivienda: '1-3-B', // Formato escalera-piso-puerta
      password: 'password123',
    };

    const result = validarRegistro(datos);
    expect(result.valido).toBe(true);
    expect(Object.keys(result.errores)).toHaveLength(0);
  });

  test('rechaza nombre corto', () => {
    const datos = {
      nombre: 'J',
      email: 'juan@example.com',
      telefono: '612345678',
      vivienda: '1-3-B',
      password: 'password123',
    };

    const result = validarRegistro(datos);
    expect(result.valido).toBe(false);
    expect(result.errores.nombre).toBeDefined();
  });

  test('rechaza email inválido', () => {
    const datos = {
      nombre: 'Juan García',
      email: 'invalid-email',
      telefono: '612345678',
      vivienda: '2-1-A',
      password: 'password123',
    };

    const result = validarRegistro(datos);
    expect(result.valido).toBe(false);
    expect(result.errores.email).toBeDefined();
  });

  test('rechaza contraseña corta', () => {
    const datos = {
      nombre: 'Juan García',
      email: 'juan@example.com',
      telefono: '612345678',
      vivienda: '3-2-C',
      password: '123',
    };

    const result = validarRegistro(datos);
    expect(result.valido).toBe(false);
    expect(result.errores.password).toBeDefined();
  });
});

describe('validarPerfil', () => {
  test('acepta datos de perfil válidos', () => {
    const datos = {
      nombre: 'Juan García',
      telefono: '612345678',
      vivienda: '1-3-B', // Formato escalera-piso-puerta
      nivelJuego: 'intermedio',
    };

    const result = validarPerfil(datos);
    expect(result.valido).toBe(true);
  });

  test('acepta perfil sin nivel de juego', () => {
    const datos = {
      nombre: 'Juan García',
      telefono: '612345678',
      vivienda: '2-1-A',
    };

    const result = validarPerfil(datos);
    expect(result.valido).toBe(true);
  });

  test('rechaza nivel de juego inválido', () => {
    const datos = {
      nombre: 'Juan García',
      telefono: '612345678',
      vivienda: '1-2-C',
      nivelJuego: 'experto',
    };

    const result = validarPerfil(datos);
    expect(result.valido).toBe(false);
    expect(result.errores.nivelJuego).toBeDefined();
  });
});

// Helper para generar fechas futuras
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}
