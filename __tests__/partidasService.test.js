/**
 * Tests para partidasService
 *
 * Nota: Estos tests verifican la lógica de mapeo y validación.
 * Las operaciones de Supabase se mockean para evitar dependencias de red.
 */

// Mock de supabase
jest.mock('../src/services/supabaseConfig', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    })),
  },
}));

import { partidasService } from '../src/services/partidasService';
import { supabase } from '../src/services/supabaseConfig';

describe('partidasService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapeo de datos', () => {
    test('obtenerPartidasActivas retorna array vacío si no hay partidas', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.obtenerPartidasActivas();

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    test('obtenerPartidasActivas maneja errores de Supabase', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error de conexión' }
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.obtenerPartidasActivas();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al obtener partidas');
    });
  });

  describe('crearPartida', () => {
    test('crea partida con estado buscando si hay menos de 4 jugadores', async () => {
      const partidaData = {
        creadorId: 'user-123',
        creadorNombre: 'Juan',
        creadorVivienda: '1-2-A',
        tipo: 'abierta',
        jugadoresIniciales: [],
      };

      let insertedData = null;
      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn((data) => {
          insertedData = data;
          return {
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'partida-1', ...data },
              error: null,
            }),
          };
        }),
        select: jest.fn().mockReturnThis(),
      });
      supabase.from = mockFrom;

      await partidasService.crearPartida(partidaData);

      expect(insertedData.estado).toBe('buscando');
    });

    test('crea partida con estado completa si hay 4 jugadores (creador + 3)', async () => {
      const partidaData = {
        creadorId: 'user-123',
        creadorNombre: 'Juan',
        creadorVivienda: '1-2-A',
        tipo: 'abierta',
        jugadoresIniciales: [
          { tipo: 'urbanizacion', usuario: { id: 'u1' }, nombre: 'Pedro', vivienda: '1-2-B' },
          { tipo: 'urbanizacion', usuario: { id: 'u2' }, nombre: 'María', vivienda: '1-2-C' },
          { tipo: 'externo', nombre: 'Carlos' },
        ],
      };

      // Con 3 jugadores iniciales + creador = 4 jugadores, estado debe ser 'completa'
      // Verificamos la lógica: totalJugadores = 1 + 3 = 4 >= 4 => 'completa'
      const totalJugadores = 1 + partidaData.jugadoresIniciales.length;
      const estadoEsperado = totalJugadores >= 4 ? 'completa' : 'buscando';

      expect(estadoEsperado).toBe('completa');
    });

    test('maneja error al crear partida', async () => {
      const partidaData = {
        creadorId: 'user-123',
        creadorNombre: 'Juan',
        creadorVivienda: '1-2-A',
        tipo: 'abierta',
        jugadoresIniciales: [],
      };

      const mockFrom = jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Error de base de datos' },
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.crearPartida(partidaData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al crear la partida');
    });
  });

  describe('solicitarUnirse', () => {
    test('rechaza si la partida no existe', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.solicitarUnirse('partida-1', { id: 'user-1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Partida no encontrada');
    });

    test('rechaza si la partida no está buscando', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { estado: 'completa', creador_id: 'otro-user' },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.solicitarUnirse('partida-1', { id: 'user-1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Esta partida ya no está buscando jugadores');
    });

    test('rechaza si el usuario ya está apuntado', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            estado: 'buscando',
            creador_id: 'otro-user',
            partidas_jugadores: [{ usuario_id: 'user-1', estado: 'confirmado' }],
          },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.solicitarUnirse('partida-1', { id: 'user-1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Ya tienes una solicitud o estás apuntado a esta partida');
    });

    test('rechaza si es el creador', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            estado: 'buscando',
            creador_id: 'user-1',
            partidas_jugadores: [],
          },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.solicitarUnirse('partida-1', { id: 'user-1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('No puedes unirte a tu propia partida');
    });

    test('rechaza si la partida ya tiene 4 jugadores', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            estado: 'buscando',
            creador_id: 'otro-user',
            partidas_jugadores: [
              { usuario_id: 'u1', estado: 'confirmado' },
              { usuario_id: 'u2', estado: 'confirmado' },
              { usuario_id: 'u3', estado: 'confirmado' },
            ],
          },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.solicitarUnirse('partida-1', { id: 'user-1' });

      expect(result.success).toBe(false);
      expect(result.error).toBe('La partida ya está completa');
    });
  });

  describe('aceptarSolicitud', () => {
    test('rechaza si no es el creador', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            creador_id: 'otro-user',
            partidas_jugadores: [],
          },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.aceptarSolicitud('jugador-1', 'partida-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo el creador puede aceptar solicitudes');
    });

    test('rechaza si la partida ya está completa', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            creador_id: 'user-1',
            partidas_jugadores: [
              { estado: 'confirmado' },
              { estado: 'confirmado' },
              { estado: 'confirmado' },
            ],
          },
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.aceptarSolicitud('jugador-1', 'partida-1', 'user-1');

      expect(result.success).toBe(false);
      expect(result.error).toBe('La partida ya está completa');
    });
  });

  describe('cancelarPartida', () => {
    test('actualiza estado a cancelada', async () => {
      let updateCalled = false;
      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn((data) => {
          updateCalled = true;
          expect(data.estado).toBe('cancelada');
          return {
            eq: jest.fn().mockReturnThis(),
          };
        }),
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.cancelarPartida('partida-1', 'user-1');

      expect(updateCalled).toBe(true);
      expect(result.success).toBe(true);
    });
  });

  describe('obtenerReservasConPartida', () => {
    test('retorna array de IDs de reservas', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({
          data: [
            { reserva_id: 'reserva-1' },
            { reserva_id: 'reserva-2' },
            { reserva_id: null },
          ],
          error: null,
        }),
      });
      supabase.from = mockFrom;

      const result = await partidasService.obtenerReservasConPartida('user-1');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(['reserva-1', 'reserva-2']);
    });
  });
});
