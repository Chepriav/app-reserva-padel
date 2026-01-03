/**
 * Tests para tablonService
 * Valida las funciones de mapeo y lógica del servicio del tablón
 */

// Mock de Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  upsert: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  gt: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
};

jest.mock('../src/services/supabaseConfig', () => ({
  supabase: mockSupabase,
}));

// Importar después del mock
const { tablonService } = require('../src/services/bulletinService');

describe('tablonService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapeo de notificaciones', () => {
    it('debe mapear correctamente una notificación de snake_case a camelCase', async () => {
      const mockNotificacion = {
        id: 'notif-123',
        usuario_id: 'user-456',
        tipo: 'desplazamiento',
        titulo: 'Reserva desplazada',
        mensaje: 'Tu reserva ha sido desplazada',
        datos: { reservaId: 'res-789' },
        leida: false,
        expira_en: '2025-01-10T10:00:00Z',
        created_at: '2025-01-03T10:00:00Z',
      };

      mockSupabase.order.mockResolvedValueOnce({
        data: [mockNotificacion],
        error: null,
      });

      const result = await tablonService.obtenerNotificaciones('user-456');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'notif-123',
        usuarioId: 'user-456',
        tipo: 'desplazamiento',
        titulo: 'Reserva desplazada',
        mensaje: 'Tu reserva ha sido desplazada',
        datos: { reservaId: 'res-789' },
        leida: false,
        expiraEn: '2025-01-10T10:00:00Z',
        createdAt: '2025-01-03T10:00:00Z',
      });
    });

    it('debe retornar array vacío si no hay notificaciones', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await tablonService.obtenerNotificaciones('user-456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('debe manejar errores de tabla no existente gracefully', async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { code: '42P01', message: 'Table not found' },
      });

      const result = await tablonService.obtenerNotificaciones('user-456');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe('mapeo de anuncios', () => {
    it('debe mapear correctamente un anuncio de snake_case a camelCase', async () => {
      const mockAnuncio = {
        id: 'anuncio-123',
        creador_id: 'admin-456',
        creador_nombre: 'Admin Test',
        titulo: 'Mantenimiento pistas',
        mensaje: 'Las pistas estarán cerradas mañana',
        tipo: 'mantenimiento',
        destinatarios: 'todos',
        expira_en: '2025-02-03T10:00:00Z',
        created_at: '2025-01-03T10:00:00Z',
      };

      mockSupabase.order.mockResolvedValueOnce({
        data: [mockAnuncio],
        error: null,
      });

      const result = await tablonService.obtenerTodosAnuncios();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({
        id: 'anuncio-123',
        creadorId: 'admin-456',
        creadorNombre: 'Admin Test',
        titulo: 'Mantenimiento pistas',
        mensaje: 'Las pistas estarán cerradas mañana',
        tipo: 'mantenimiento',
        destinatarios: 'todos',
        expiraEn: '2025-02-03T10:00:00Z',
        createdAt: '2025-01-03T10:00:00Z',
        leido: true, // Admin siempre ve como leído
      });
    });
  });

  describe('operaciones CRUD', () => {
    it('debe marcar notificación como leída', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await tablonService.marcarNotificacionLeida('notif-123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('notificaciones_usuario');
      expect(mockSupabase.update).toHaveBeenCalledWith({ leida: true });
    });

    it('debe eliminar notificación correctamente', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await tablonService.eliminarNotificacion('notif-123');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('notificaciones_usuario');
      expect(mockSupabase.delete).toHaveBeenCalled();
    });

    it('debe manejar error al eliminar notificación', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Delete failed' },
      });

      const result = await tablonService.eliminarNotificacion('notif-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al eliminar notificación');
    });
  });

  describe('contadores', () => {
    it('debe contar notificaciones no leídas', async () => {
      mockSupabase.gt.mockResolvedValueOnce({
        count: 5,
        error: null,
      });

      const result = await tablonService.contarNotificacionesNoLeidas('user-456');

      expect(result.success).toBe(true);
      expect(result.count).toBe(5);
    });

    it('debe retornar 0 si hay error', async () => {
      mockSupabase.gt.mockResolvedValueOnce({
        count: null,
        error: { message: 'Error' },
      });

      const result = await tablonService.contarNotificacionesNoLeidas('user-456');

      expect(result.success).toBe(true);
      expect(result.count).toBe(0);
    });
  });

  describe('marcar todas como leídas', () => {
    it('debe llamar a update con leida: true para notificaciones del usuario', async () => {
      // Verificar que se llama a los métodos correctos
      // El resultado depende del mock, pero verificamos la estructura
      await tablonService.marcarTodasLeidas('user-456');

      expect(mockSupabase.from).toHaveBeenCalledWith('notificaciones_usuario');
      expect(mockSupabase.update).toHaveBeenCalledWith({ leida: true });
    });
  });

  describe('crear notificación', () => {
    it('debe crear notificación con todos los campos', async () => {
      const mockCreatedNotif = {
        id: 'new-notif-123',
        usuario_id: 'user-456',
        tipo: 'partida_solicitud',
        titulo: 'Nueva solicitud',
        mensaje: 'Juan quiere unirse a tu partida',
        datos: { partidaId: 'partida-789' },
        leida: false,
        expira_en: '2025-01-10T10:00:00Z',
        created_at: '2025-01-03T10:00:00Z',
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockCreatedNotif,
        error: null,
      });

      const result = await tablonService.crearNotificacion(
        'user-456',
        'partida_solicitud',
        'Nueva solicitud',
        'Juan quiere unirse a tu partida',
        { partidaId: 'partida-789' }
      );

      expect(result.success).toBe(true);
      expect(result.data.tipo).toBe('partida_solicitud');
      expect(result.data.usuarioId).toBe('user-456');
    });
  });

  describe('obtener usuarios aprobados', () => {
    it('debe retornar lista de usuarios aprobados', async () => {
      const mockUsers = [
        { id: 'user-1', nombre: 'Juan', vivienda: '1-3-A', email: 'juan@test.com' },
        { id: 'user-2', nombre: 'María', vivienda: '2-1-B', email: 'maria@test.com' },
      ];

      mockSupabase.order.mockResolvedValueOnce({
        data: mockUsers,
        error: null,
      });

      const result = await tablonService.obtenerUsuariosAprobados();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].nombre).toBe('Juan');
      expect(result.data[1].nombre).toBe('María');
    });
  });

  describe('marcar anuncio como leído', () => {
    it('debe usar upsert para marcar anuncio como leído', async () => {
      mockSupabase.upsert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await tablonService.marcarAnuncioLeido('anuncio-123', 'user-456');

      expect(result.success).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('anuncios_destinatarios');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          anuncio_id: 'anuncio-123',
          usuario_id: 'user-456',
          leido: true,
        }),
        { onConflict: 'anuncio_id,usuario_id' }
      );
    });
  });
});
