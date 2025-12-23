// Configuración de horarios
export const HORARIOS_CONFIG = {
  horaApertura: '08:00',
  horaCierre: '22:00',
  duracionBloque: 30, // minutos - bloques de 30 minutos
};

// Duración de bloque (para usar en servicios)
export const DURACION_BLOQUE = 30;

// Opciones de duración de reserva (en minutos)
export const DURACIONES_RESERVA = [30, 60, 90]; // 30 min, 1h, 1.5h

// Límites de reserva
export const LIMITES_RESERVA = {
  maxReservasActivas: 2,
  horasAnticipacionMinima: 2,
  diasAnticipacionMaxima: 7,
  horasCancelacionMinima: 4,
};

// Configuración de pistas
export const PISTAS = [
  {
    id: '1',
    nombre: 'Pista de Pádel',
    descripcion: 'Pista de pádel de la urbanización',
    techada: false,
    conLuz: true,
    estado: 'disponible',
    capacidadJugadores: 4,
  },
];

// Horarios disponibles del día (bloques de 90 minutos)
export const HORARIOS_DISPONIBLES = [
  { inicio: '08:00', fin: '09:30' },
  { inicio: '09:30', fin: '11:00' },
  { inicio: '11:00', fin: '12:30' },
  { inicio: '12:30', fin: '14:00' },
  { inicio: '14:00', fin: '15:30' },
  { inicio: '15:30', fin: '17:00' },
  { inicio: '17:00', fin: '18:30' },
  { inicio: '18:30', fin: '20:00' },
  { inicio: '20:00', fin: '21:30' },
];

// Niveles de juego
export const NIVELES_JUEGO = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'profesional', label: 'Profesional' }
];
