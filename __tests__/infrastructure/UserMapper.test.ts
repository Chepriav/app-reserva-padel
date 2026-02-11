import {
  toDomain,
  toApartmentUserDomain,
  toDbProfileUpdate,
  toDbCreateRow,
  toLegacyFormat,
  fromLegacyFormat,
  fromLegacyRegisterData,
  approvalStatusToDomain,
  approvalStatusToDb,
  skillLevelToDomain,
  skillLevelToDb,
} from '../../src/infrastructure/supabase/mappers/userMapper';

const dbRow = {
  id: 'user-1',
  nombre: 'Test User',
  email: 'test@example.com',
  telefono: '123456789',
  vivienda: '1-3-B',
  vivienda_solicitada: '2-1-A',
  nivel_juego: 'intermedio',
  foto_perfil: 'https://example.com/photo.jpg',
  es_admin: true,
  es_manager: false,
  es_demo: false,
  estado_aprobacion: 'aprobado',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
};

describe('userMapper', () => {
  describe('toDomain', () => {
    it('maps DB row to domain entity with English fields', () => {
      const user = toDomain(dbRow);
      expect(user.id).toBe('user-1');
      expect(user.name).toBe('Test User');
      expect(user.email).toBe('test@example.com');
      expect(user.phone).toBe('123456789');
      expect(user.apartment).toBe('1-3-B');
      expect(user.requestedApartment).toBe('2-1-A');
      expect(user.skillLevel).toBe('intermediate');
      expect(user.profilePhoto).toBe('https://example.com/photo.jpg');
      expect(user.isAdmin).toBe(true);
      expect(user.isManager).toBe(false);
      expect(user.isDemo).toBe(false);
      expect(user.approvalStatus).toBe('approved');
    });
  });

  describe('toApartmentUserDomain', () => {
    it('maps partial DB row to ApartmentUser', () => {
      const row = {
        id: 'user-1',
        nombre: 'Test User',
        email: 'test@example.com',
        foto_perfil: null,
        nivel_juego: 'avanzado',
      };
      const result = toApartmentUserDomain(row);
      expect(result.name).toBe('Test User');
      expect(result.skillLevel).toBe('advanced');
      expect(result.profilePhoto).toBeNull();
    });
  });

  describe('toLegacyFormat', () => {
    it('maps domain entity to legacy Spanish camelCase', () => {
      const user = toDomain(dbRow);
      const legacy = toLegacyFormat(user);
      expect(legacy.nombre).toBe('Test User');
      expect(legacy.telefono).toBe('123456789');
      expect(legacy.vivienda).toBe('1-3-B');
      expect(legacy.viviendaSolicitada).toBe('2-1-A');
      expect(legacy.nivelJuego).toBe('intermedio');
      expect(legacy.fotoPerfil).toBe('https://example.com/photo.jpg');
      expect(legacy.esAdmin).toBe(true);
      expect(legacy.estadoAprobacion).toBe('aprobado');
    });
  });

  describe('roundtrip: DB → domain → legacy', () => {
    it('preserves all data through the mapping chain', () => {
      const user = toDomain(dbRow);
      const legacy = toLegacyFormat(user);

      expect(legacy.id).toBe(dbRow.id);
      expect(legacy.nombre).toBe(dbRow.nombre);
      expect(legacy.email).toBe(dbRow.email);
      expect(legacy.telefono).toBe(dbRow.telefono);
      expect(legacy.vivienda).toBe(dbRow.vivienda);
      expect(legacy.viviendaSolicitada).toBe(dbRow.vivienda_solicitada);
      expect(legacy.nivelJuego).toBe(dbRow.nivel_juego);
      expect(legacy.fotoPerfil).toBe(dbRow.foto_perfil);
      expect(legacy.esAdmin).toBe(dbRow.es_admin);
      expect(legacy.esManager).toBe(dbRow.es_manager);
      expect(legacy.esDemo).toBe(dbRow.es_demo);
      expect(legacy.estadoAprobacion).toBe(dbRow.estado_aprobacion);
    });
  });

  describe('fromLegacyFormat', () => {
    it('maps legacy fields to domain ProfileUpdate', () => {
      const legacy = { nombre: 'Updated', telefono: '999', nivelJuego: 'avanzado' };
      const updates = fromLegacyFormat(legacy);
      expect(updates.name).toBe('Updated');
      expect(updates.phone).toBe('999');
      expect(updates.skillLevel).toBe('advanced');
    });

    it('strips protected fields (esAdmin, estadoAprobacion)', () => {
      const legacy = {
        nombre: 'Test',
        esAdmin: true,
        estadoAprobacion: 'aprobado',
      };
      const updates = fromLegacyFormat(legacy);
      expect(updates.name).toBe('Test');
      expect(updates).not.toHaveProperty('isAdmin');
      expect(updates).not.toHaveProperty('approvalStatus');
    });

    it('handles null skillLevel', () => {
      const legacy = { nivelJuego: null };
      const updates = fromLegacyFormat(legacy);
      expect(updates.skillLevel).toBeNull();
    });
  });

  describe('fromLegacyRegisterData', () => {
    it('maps legacy register form to domain RegisterData', () => {
      const form = {
        nombre: 'New User',
        email: 'new@test.com',
        password: 'pass123',
        telefono: '111',
        vivienda: '1-1-A',
      };
      const data = fromLegacyRegisterData(form);
      expect(data.name).toBe('New User');
      expect(data.email).toBe('new@test.com');
      expect(data.password).toBe('pass123');
      expect(data.phone).toBe('111');
      expect(data.apartment).toBe('1-1-A');
    });
  });

  describe('toDbProfileUpdate', () => {
    it('maps domain ProfileUpdate to DB snake_case', () => {
      const updates = {
        name: 'Updated',
        phone: '999',
        skillLevel: 'beginner' as const,
        profilePhoto: 'https://new.jpg',
      };
      const dbUpdates = toDbProfileUpdate(updates);
      expect(dbUpdates.nombre).toBe('Updated');
      expect(dbUpdates.telefono).toBe('999');
      expect(dbUpdates.nivel_juego).toBe('principiante');
      expect(dbUpdates.foto_perfil).toBe('https://new.jpg');
    });

    it('only includes defined fields', () => {
      const updates = { name: 'Only Name' };
      const dbUpdates = toDbProfileUpdate(updates);
      expect(Object.keys(dbUpdates)).toEqual(['nombre']);
    });
  });

  describe('toDbCreateRow', () => {
    it('creates DB insert row with pending status', () => {
      const data = {
        name: 'New',
        email: 'new@test.com',
        password: 'pass',
        phone: '111',
        apartment: '1-1-A',
      };
      const row = toDbCreateRow('uid-1', data);
      expect(row.id).toBe('uid-1');
      expect(row.nombre).toBe('New');
      expect(row.email).toBe('new@test.com');
      expect(row.es_admin).toBe(false);
      expect(row.estado_aprobacion).toBe('pendiente');
    });
  });

  describe('enum translators', () => {
    it('translates approval status to domain', () => {
      expect(approvalStatusToDomain('pendiente')).toBe('pending');
      expect(approvalStatusToDomain('aprobado')).toBe('approved');
      expect(approvalStatusToDomain('rechazado')).toBe('rejected');
      expect(approvalStatusToDomain('unknown')).toBe('pending');
    });

    it('translates approval status to DB', () => {
      expect(approvalStatusToDb('pending')).toBe('pendiente');
      expect(approvalStatusToDb('approved')).toBe('aprobado');
      expect(approvalStatusToDb('rejected')).toBe('rechazado');
    });

    it('translates skill level to domain', () => {
      expect(skillLevelToDomain('principiante')).toBe('beginner');
      expect(skillLevelToDomain('intermedio')).toBe('intermediate');
      expect(skillLevelToDomain('avanzado')).toBe('advanced');
      expect(skillLevelToDomain('profesional')).toBe('professional');
      expect(skillLevelToDomain(null)).toBeNull();
      expect(skillLevelToDomain('unknown')).toBeNull();
    });

    it('translates skill level to DB', () => {
      expect(skillLevelToDb('beginner')).toBe('principiante');
      expect(skillLevelToDb('intermediate')).toBe('intermedio');
      expect(skillLevelToDb('advanced')).toBe('avanzado');
      expect(skillLevelToDb('professional')).toBe('profesional');
      expect(skillLevelToDb(null)).toBeNull();
    });
  });
});
