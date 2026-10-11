import { csvImportService } from '../src/services/csvImportService';

describe('csvImportService.validateCSVRow', () => {
  it('accepts a row parsed from the documented "nombre,codigo,email" header', () => {
    const result = csvImportService.validateCSVRow(
      { nombre: 'Usuario Prueba', codigo: '1-1-A', email: 'prueba@example.com' },
      2,
    );
    expect(result.errors ?? []).toEqual([]);
  });
});

describe('csvImportService.parseCSV header', () => {
  it('sanitized row keeps the name from the "nombre" column', () => {
    const result = csvImportService.validateCSVRow(
      { nombre: '  María López ', codigo: '2-4-C', email: 'MARIA@example.com' },
      3,
    );
    expect(result.valid).toBe(true);
    expect(result.sanitized).toEqual(expect.objectContaining({
      name: 'María López',
      email: 'maria@example.com',
      apartment: '2-4-C',
    }));
  });
});
