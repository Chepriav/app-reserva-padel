import {
  matchToDomain,
  playerToDomain,
  toLegacyFormat,
  playerToLegacy,
  toDbInsert,
  matchStatusToDomain,
  matchStatusToDb,
  matchTypeToDomain,
  matchTypeToDb,
  playerStatusToDomain,
  playerStatusToDb,
} from '@infrastructure/supabase/mappers/matchMapper';
import type { Match, Player } from '@domain/entities/Match';

const makePlayerRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'player-1',
  partida_id: 'match-1',
  usuario_id: 'user-2',
  usuario_nombre: 'Bob',
  usuario_vivienda: '2B',
  usuario_foto: null,
  nivel_juego: 'intermedio',
  es_externo: false,
  estado: 'confirmado',
  created_at: '2027-01-01T10:00:00Z',
  ...overrides,
});

const makeMatchRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'match-1',
  creador_id: 'user-1',
  creador_nombre: 'Alice',
  creador_vivienda: '1A',
  creador_foto: null,
  creador_nivel: null,
  reserva_id: null,
  fecha: '2027-01-10',
  hora_inicio: '10:00',
  hora_fin: '11:30',
  pista_nombre: 'Pista 1',
  tipo: 'abierta',
  mensaje: 'Looking for players',
  nivel_preferido: null,
  estado: 'buscando',
  es_clase: false,
  niveles: null,
  min_participantes: 4,
  max_participantes: 4,
  precio_alumno: null,
  precio_grupo: null,
  created_at: '2027-01-01T10:00:00Z',
  updated_at: '2027-01-01T10:00:00Z',
  ...overrides,
});

describe('MatchMapper — enum translations', () => {
  it('maps match status both ways', () => {
    expect(matchStatusToDomain('buscando')).toBe('searching');
    expect(matchStatusToDomain('completa')).toBe('full');
    expect(matchStatusToDomain('cancelada')).toBe('cancelled');
    expect(matchStatusToDb('searching')).toBe('buscando');
    expect(matchStatusToDb('full')).toBe('completa');
    expect(matchStatusToDb('cancelled')).toBe('cancelada');
  });

  it('maps match type both ways', () => {
    expect(matchTypeToDomain('abierta')).toBe('open');
    expect(matchTypeToDomain('con_reserva')).toBe('with_reservation');
    expect(matchTypeToDb('open')).toBe('abierta');
    expect(matchTypeToDb('with_reservation')).toBe('con_reserva');
  });

  it('maps player status both ways', () => {
    expect(playerStatusToDomain('confirmado')).toBe('confirmed');
    expect(playerStatusToDomain('pendiente')).toBe('pending');
    expect(playerStatusToDomain('rechazado')).toBe('rejected');
    expect(playerStatusToDb('confirmed')).toBe('confirmado');
    expect(playerStatusToDb('pending')).toBe('pendiente');
    expect(playerStatusToDb('rejected')).toBe('rechazado');
  });

  it('returns default for unknown status', () => {
    expect(matchStatusToDomain('unknown')).toBe('searching');
    expect(matchTypeToDomain('unknown')).toBe('open');
    expect(playerStatusToDomain('unknown')).toBe('confirmed');
  });
});

describe('MatchMapper — playerToDomain', () => {
  it('maps player row to domain entity', () => {
    const player = playerToDomain(makePlayerRow());
    expect(player.id).toBe('player-1');
    expect(player.matchId).toBe('match-1');
    expect(player.userId).toBe('user-2');
    expect(player.userName).toBe('Bob');
    expect(player.userApartment).toBe('2B');
    expect(player.skillLevel).toBe('intermediate');
    expect(player.isExternal).toBe(false);
    expect(player.status).toBe('confirmed');
  });

  it('handles null userId (external player)', () => {
    const player = playerToDomain(makePlayerRow({ usuario_id: null }));
    expect(player.userId).toBeNull();
  });
});

describe('MatchMapper — matchToDomain', () => {
  it('maps match row with players to domain entity', () => {
    const players = [playerToDomain(makePlayerRow())];
    const match = matchToDomain(makeMatchRow(), players);

    expect(match.id).toBe('match-1');
    expect(match.creatorId).toBe('user-1');
    expect(match.creatorName).toBe('Alice');
    expect(match.status).toBe('searching');
    expect(match.type).toBe('open');
    expect(match.isClass).toBe(false);
    expect(match.players).toHaveLength(1);
    expect(match.players[0].status).toBe('confirmed');
  });

  it('defaults to empty players array', () => {
    const match = matchToDomain(makeMatchRow());
    expect(match.players).toEqual([]);
  });
});

describe('MatchMapper — toLegacyFormat', () => {
  it('converts domain match to legacy camelCase Spanish', () => {
    const players = [playerToDomain(makePlayerRow())];
    const match = matchToDomain(makeMatchRow(), players);
    const legacy = toLegacyFormat(match) as Record<string, unknown>;

    expect(legacy.id).toBe('match-1');
    expect(legacy.creadorId).toBe('user-1');
    expect(legacy.creadorNombre).toBe('Alice');
    expect(legacy.estado).toBe('buscando');
    expect(legacy.tipo).toBe('abierta');
    expect(legacy.esClase).toBe(false);
    expect(Array.isArray(legacy.jugadores)).toBe(true);
    expect((legacy.jugadores as unknown[]).length).toBe(1);
  });

  it('roundtrip: DB row → domain → legacy preserves key data', () => {
    const match = matchToDomain(makeMatchRow({ estado: 'completa', tipo: 'con_reserva' }));
    const legacy = toLegacyFormat(match) as Record<string, unknown>;

    expect(legacy.estado).toBe('completa');
    expect(legacy.tipo).toBe('con_reserva');
  });
});

describe('MatchMapper — toDbInsert', () => {
  it('maps CreateMatchData to DB insert row', () => {
    const row = toDbInsert({
      creatorId: 'user-1',
      creatorName: 'Alice',
      creatorApartment: '1A',
      date: '2027-01-10',
      startTime: '10:00',
      type: 'with_reservation',
      isClass: false,
    });

    expect(row.creador_id).toBe('user-1');
    expect(row.fecha).toBe('2027-01-10');
    expect(row.tipo).toBe('con_reserva');
    expect(row.estado).toBe('buscando');
  });
});
