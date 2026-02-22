import {
  PLAY_LEVELS,
  SKILL_LEVELS,
  isValidApartment,
  isApartmentValid,
  parseApartment,
  combineApartment,
  formatApartment,
  APARTMENT_CONFIG,
  SCHEDULE_CONFIG,
  RESERVATION_LIMITS,
  CLASS_CONFIG,
  // Legacy aliases
  NIVELES_JUEGO,
  parseVivienda,
  combinarVivienda,
  esViviendaValida,
} from '../src/constants/config';

describe('config — English aliases', () => {
  test('SKILL_LEVELS is the same reference as PLAY_LEVELS', () => {
    expect(SKILL_LEVELS).toBe(PLAY_LEVELS);
  });

  test('isApartmentValid is the same reference as isValidApartment', () => {
    expect(isApartmentValid).toBe(isValidApartment);
  });

  test('isApartmentValid("1-3-B") returns true', () => {
    expect(isApartmentValid('1-3-B')).toBe(true);
  });

  test('isApartmentValid(null) returns false', () => {
    expect(isApartmentValid(null)).toBe(false);
  });

  test('isApartmentValid("bad") returns false', () => {
    expect(isApartmentValid('bad')).toBe(false);
  });
});

describe('config — core English exports', () => {
  test('PLAY_LEVELS has 4 levels', () => {
    expect(PLAY_LEVELS).toHaveLength(4);
  });

  test('parseApartment parses "2-4-C" correctly', () => {
    const parsed = parseApartment('2-4-C');
    expect(parsed).toEqual(expect.objectContaining({ stair: '2', floor: '4', door: 'C' }));
  });

  test('combineApartment builds correct string', () => {
    expect(combineApartment('1', '3', 'B')).toBe('1-3-B');
  });

  test('formatApartment returns readable string', () => {
    expect(formatApartment('1-3-B')).toContain('Esc. 1');
  });

  test('APARTMENT_CONFIG has stairs array', () => {
    expect(Array.isArray(APARTMENT_CONFIG.stairs)).toBe(true);
  });

  test('SCHEDULE_CONFIG has openingTime', () => {
    expect(SCHEDULE_CONFIG.openingTime).toBe('08:00');
  });
});

describe('config — legacy aliases still work', () => {
  test('NIVELES_JUEGO is same as PLAY_LEVELS', () => {
    expect(NIVELES_JUEGO).toBe(PLAY_LEVELS);
  });

  test('parseVivienda is same as parseApartment', () => {
    expect(parseVivienda).toBe(parseApartment);
  });

  test('combinarVivienda is same as combineApartment', () => {
    expect(combinarVivienda).toBe(combineApartment);
  });

  test('esViviendaValida is same as isValidApartment', () => {
    expect(esViviendaValida).toBe(isValidApartment);
  });
});
