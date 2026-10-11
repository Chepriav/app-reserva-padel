import { translateError } from '../src/services/errorMessages';

describe('translateError', () => {
  it('maps domain codes to Spanish messages', () => {
    expect(translateError({ code: 'MATCH_FULL', message: 'Match is full' })).toBe('La partida ya está completa.');
    expect(translateError({ code: 'MATCH_PERMISSION_ERROR' })).toMatch(/creador/);
    expect(translateError({ code: 'INFRASTRUCTURE_ERROR', message: 'Error creating match' })).toMatch(/conexión/);
  });

  it('never leaks the raw (English) message for unknown codes', () => {
    expect(translateError({ code: 'SOMETHING_NEW', message: 'Error fetching stuff' })).toBe('Ha ocurrido un error. Inténtalo de nuevo.');
    expect(translateError(undefined, 'Mensaje propio')).toBe('Mensaje propio');
  });
});
