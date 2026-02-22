import { toDomain, toLegacyFormat } from '../../src/infrastructure/supabase/mappers/courtMapper';

const dbRow = {
  id: 'court-1',
  nombre: 'Pista 1',
  descripcion: 'Pista principal',
  techada: true,
  con_luz: false,
  capacidad_jugadores: 4,
};

describe('courtMapper — toDomain', () => {
  it('maps DB row to domain entity with English field names', () => {
    const c = toDomain(dbRow);
    expect(c.id).toBe('court-1');
    expect(c.name).toBe('Pista 1');
    expect(c.description).toBe('Pista principal');
    expect(c.covered).toBe(true);
    expect(c.hasLights).toBe(false);
    expect(c.playerCapacity).toBe(4);
  });

  it('uses default values for missing optional fields', () => {
    const c = toDomain({ id: 'c-2', nombre: 'Pista 2' });
    expect(c.description).toBeNull();
    expect(c.covered).toBe(false);
    expect(c.hasLights).toBe(false);
    expect(c.playerCapacity).toBe(4);
  });

  it('maps court with lights and without cover', () => {
    const c = toDomain({ ...dbRow, techada: false, con_luz: true });
    expect(c.covered).toBe(false);
    expect(c.hasLights).toBe(true);
  });
});

describe('courtMapper — toLegacyFormat', () => {
  it('maps domain entity to camelCase legacy format', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.id).toBe('court-1');
    expect(legacy.name).toBe('Pista 1');
    expect(legacy.description).toBe('Pista principal');
    expect(legacy.covered).toBe(true);
    expect(legacy.hasLights).toBe(false);
    expect(legacy.playerCapacity).toBe(4);
  });

  it('roundtrip preserves all data', () => {
    const domain = toDomain(dbRow);
    const legacy = toLegacyFormat(domain);
    expect(legacy.name).toBe(dbRow.nombre);
    expect(legacy.description).toBe(dbRow.descripcion);
    expect(legacy.covered).toBe(dbRow.techada);
    expect(legacy.hasLights).toBe(dbRow.con_luz);
    expect(legacy.playerCapacity).toBe(dbRow.capacidad_jugadores);
  });
});
