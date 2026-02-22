import {
  validateEmail,
  validatePhone,
  validateApartmentComponents,
  canMakeReservation,
  canCancelReservation,
  validateRegistration,
  validateProfile,
  // Legacy aliases
  validateTelefono,
  validateApartmentComponentes,
  puedeReservar,
  puedeCancel,
  validateRegistro,
} from '../src/utils/validators';

describe('validateEmail', () => {
  test('acepta emails válidos', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@domain.es')).toBe(true);
    expect(validateEmail('user+tag@example.org')).toBe(true);
  });

  test('rechaza emails inválidos', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('missing@domain')).toBe(false);
    expect(validateEmail('@nodomain.com')).toBe(false);
    expect(validateEmail('spaces in@email.com')).toBe(false);
  });
});

describe('validatePhone', () => {
  test('acepta teléfonos válidos', () => {
    expect(validatePhone('612345678')).toBe(true);
    expect(validatePhone('912345678')).toBe(true);
    expect(validatePhone('+34612345678')).toBe(true);
    expect(validatePhone('612 345 678')).toBe(true);
    expect(validatePhone('612-345-678')).toBe(true);
  });

  test('rechaza teléfonos inválidos', () => {
    expect(validatePhone('12345')).toBe(false);
    expect(validatePhone('abcdefghi')).toBe(false);
    expect(validatePhone('')).toBe(false);
  });
});

describe('canMakeReservation', () => {
  const user = { id: 'user1', apartment: '1-3-B' };

  test('permite reservar sin reservas previas', () => {
    const newReservation = {
      date: getFutureDate(1),
      startTime: '10:00',
      courtId: 'court-1',
    };

    const result = canMakeReservation(user, newReservation, []);
    expect(result.valid).toBe(true);
  });

  test('rechaza reservar en horarios pasados', () => {
    const newReservation = {
      date: '2020-01-01',
      startTime: '10:00',
      courtId: 'court-1',
    };

    const result = canMakeReservation(user, newReservation, []);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('pasados');
  });

  test('rechaza si ya tiene 1 reserva activa', () => {
    const currentReservations = [
      { id: '1', userId: 'user1', status: 'confirmed', apartment: '1-3-B', date: getFutureDate(2), startTime: '10:00', endTime: '11:00' },
    ];
    const newReservation = {
      date: getFutureDate(3),
      startTime: '14:00',
      courtId: 'court-1',
    };

    const result = canMakeReservation(user, newReservation, currentReservations);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('1 reserva');
  });

  test('rechaza si ya tiene reserva a la misma hora', () => {
    const futureDate = getFutureDate(1);
    const currentReservations = [
      { id: '1', userId: 'user1', status: 'confirmed', apartment: '1-3-B', date: futureDate, startTime: '10:00' },
    ];
    const newReservation = {
      date: futureDate,
      startTime: '10:00',
      courtId: 'court-2',
    };

    const result = canMakeReservation(user, newReservation, currentReservations);
    expect(result.valid).toBe(false);
  });
});

describe('canCancelReservation', () => {
  test('permite cancelar con más de 1.5 horas de anticipación', () => {
    const reservation = {
      date: getFutureDate(1),
      startTime: '10:00',
    };

    const result = canCancelReservation(reservation);
    expect(result.valid).toBe(true);
  });

  test('permite cancelación en cualquier momento (incluso inmediata)', () => {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const minutesLeft = now.getMinutes() + 30;
    const startTime = minutesLeft >= 60
      ? `${String(currentHour + 1).padStart(2, '0')}:${String(minutesLeft - 60).padStart(2, '0')}`
      : `${String(currentHour).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}`;

    const reservation = { date, startTime };
    const result = canCancelReservation(reservation);
    expect(result.valid).toBe(true);
  });
});

describe('validateRegistration', () => {
  test('acepta datos de registro válidos', () => {
    const data = {
      name: 'Juan García',
      email: 'juan@example.com',
      phone: '612345678',
      apartment: '1-3-B',
      password: 'password123',
    };

    const result = validateRegistration(data);
    expect(result.valid).toBe(true);
    expect(result.valido).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('rechaza nombre corto', () => {
    const data = {
      name: 'J',
      email: 'juan@example.com',
      phone: '612345678',
      apartment: '1-3-B',
      password: 'password123',
    };

    const result = validateRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  test('rechaza email inválido', () => {
    const data = {
      name: 'Juan García',
      email: 'invalid-email',
      phone: '612345678',
      apartment: '2-1-A',
      password: 'password123',
    };

    const result = validateRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });

  test('rechaza contraseña corta', () => {
    const data = {
      name: 'Juan García',
      email: 'juan@example.com',
      phone: '612345678',
      apartment: '3-2-C',
      password: '123',
    };

    const result = validateRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.password).toBeDefined();
  });
});

describe('validateProfile', () => {
  test('acepta datos de perfil válidos', () => {
    const data = {
      name: 'Juan García',
      phone: '612345678',
      apartment: '1-3-B',
      skillLevel: 'intermedio',
    };

    const result = validateProfile(data);
    expect(result.valid).toBe(true);
    expect(result.valido).toBe(true);
  });

  test('acepta perfil sin nivel de juego', () => {
    const data = {
      name: 'Juan García',
      phone: '612345678',
      apartment: '2-1-A',
    };

    const result = validateProfile(data);
    expect(result.valid).toBe(true);
  });

  test('rechaza nivel de juego inválido', () => {
    const data = {
      name: 'Juan García',
      phone: '612345678',
      apartment: '1-2-C',
      skillLevel: 'experto',
    };

    const result = validateProfile(data);
    expect(result.valid).toBe(false);
    expect(result.errors.skillLevel).toBeDefined();
  });
});

describe('validateApartmentComponents', () => {
  test('acepta componentes válidos', () => {
    const result = validateApartmentComponents('1', '3', 'B');
    expect(result.valid).toBe(true);
  });

  test('rechaza escalera vacía', () => {
    const result = validateApartmentComponents('', '3', 'B');
    expect(result.valid).toBe(false);
    expect(result.errors.escalera).toBeDefined();
  });

  test('rechaza escalera inválida (fuera de rango)', () => {
    const result = validateApartmentComponents('99', '3', 'B');
    expect(result.valid).toBe(false);
    expect(result.errors.escalera).toBeDefined();
  });

  test('rechaza piso vacío', () => {
    const result = validateApartmentComponents('1', '', 'B');
    expect(result.valid).toBe(false);
    expect(result.errors.piso).toBeDefined();
  });

  test('rechaza piso inválido', () => {
    const result = validateApartmentComponents('1', '99', 'B');
    expect(result.valid).toBe(false);
    expect(result.errors.piso).toBeDefined();
  });

  test('rechaza puerta vacía', () => {
    const result = validateApartmentComponents('1', '3', '');
    expect(result.valid).toBe(false);
    expect(result.errors.puerta).toBeDefined();
  });

  test('rechaza puerta inválida', () => {
    const result = validateApartmentComponents('1', '3', 'Z');
    expect(result.valid).toBe(false);
    expect(result.errors.puerta).toBeDefined();
  });
});

describe('validateRegistration — legacy telefono field', () => {
  test('acepta datos con campo legacy "telefono"', () => {
    const data = {
      name: 'Juan García',
      email: 'juan@example.com',
      telefono: '612345678',
      apartment: '1-3-B',
      password: 'password123',
    };
    const result = validateRegistration(data);
    expect(result.valid).toBe(true);
  });

  test('rechaza teléfono inválido con campo legacy "telefono"', () => {
    const data = {
      name: 'Juan García',
      email: 'juan@example.com',
      telefono: '123',
      apartment: '1-3-B',
      password: 'password123',
    };
    const result = validateRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.telefono).toBeDefined();
  });

  test('rechaza vivienda inválida', () => {
    const data = {
      name: 'Juan García',
      email: 'juan@example.com',
      phone: '612345678',
      apartment: 'invalid',
      password: 'password123',
    };
    const result = validateRegistration(data);
    expect(result.valid).toBe(false);
    expect(result.errors.apartment).toBeDefined();
  });
});

describe('validateProfile — legacy telefono field', () => {
  test('rechaza teléfono inválido con campo legacy "telefono"', () => {
    const data = {
      name: 'Juan García',
      telefono: '123',
      apartment: '1-3-B',
    };
    const result = validateProfile(data);
    expect(result.valid).toBe(false);
    expect(result.errors.telefono).toBeDefined();
  });

  test('rechaza vivienda inválida en perfil', () => {
    const data = {
      name: 'Juan García',
      phone: '612345678',
      apartment: 'bad',
    };
    const result = validateProfile(data);
    expect(result.valid).toBe(false);
    expect(result.errors.apartment).toBeDefined();
  });
});

describe('legacy aliases', () => {
  test('validateTelefono is alias of validatePhone', () => expect(validateTelefono).toBe(validatePhone));
  test('validateApartmentComponentes is alias of validateApartmentComponents', () => expect(validateApartmentComponentes).toBe(validateApartmentComponents));
  test('puedeReservar is alias of canMakeReservation', () => expect(puedeReservar).toBe(canMakeReservation));
  test('puedeCancel is alias of canCancelReservation', () => expect(puedeCancel).toBe(canCancelReservation));
  test('validateRegistro is alias of validateRegistration', () => expect(validateRegistro).toBe(validateRegistration));
});

// Helper para generar fechas futuras
function getFutureDate(daysAhead) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().split('T')[0];
}
