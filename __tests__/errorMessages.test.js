import { translateError } from '../src/services/errorMessages';

describe('translateError', () => {
  it('maps domain codes to Spanish messages', () => {
    expect(translateError({ code: 'MATCH_FULL', message: 'Match is full' })).toBe('La partida ya está completa.');
    expect(translateError({ code: 'MATCH_PERMISSION_ERROR' })).toMatch(/organizador/);
    expect(translateError({ code: 'INFRASTRUCTURE_ERROR', message: 'Error creating match' })).toMatch(/conectar/);
  });

  it('never leaks the raw (English) message for unknown codes', () => {
    expect(translateError({ code: 'SOMETHING_NEW', message: 'Error fetching stuff' })).toBe('Algo ha fallado. Inténtalo de nuevo en unos segundos.');
    expect(translateError(undefined, 'Mensaje propio')).toBe('Mensaje propio');
  });

  it('explains a missing connection instead of a generic error', () => {
    const offline = { code: 'INFRASTRUCTURE_ERROR', message: 'x', cause: { message: 'TypeError: Failed to fetch' } };
    expect(translateError(offline)).toMatch(/Sin conexión/);
    expect(translateError({ message: 'Load failed' })).toMatch(/Sin conexión/);
  });
});
