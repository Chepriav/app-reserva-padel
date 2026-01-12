// Schedule configuration
export const SCHEDULE_CONFIG = {
  openingTime: '08:00',
  closingTime: '22:00',
  slotDuration: 30, // minutes - 30-minute slots
};

// Slot duration (for use in services)
export const SLOT_DURATION = 30;

// Reservation limits
export const RESERVATION_LIMITS = {
  maxActiveReservations: 1, // Per apartment (reduced from 2)
  minAdvanceHours: 0,
  maxAdvanceDays: 7,
  minCancellationHours: 0, // No time limit - can cancel anytime
};

// Priority labels for UI (Spanish - user-facing)
export const PRIORITY_LABELS = {
  primera: 'Garantizada',
  segunda: 'Provisional',
};

// Play levels (Spanish labels - user-facing)
export const PLAY_LEVELS = [
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'profesional', label: 'Profesional' },
];

// Class configuration
export const CLASS_CONFIG = {
  MIN_STUDENTS: 2,
  MAX_STUDENTS: 8,
  MIN_OPTIONS: [2, 3, 4],
  MAX_OPTIONS: [4, 5, 6, 7, 8],
};

// Apartment configuration
export const APARTMENT_CONFIG = {
  stairs: [1, 2, 3, 4, 5, 6],
  floors: [1, 2, 3, 4, 5, 6],
  doors: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'],
};

/**
 * Format apartment for display to user
 * @param {string} apartmentStr - Stored format "1-3-B"
 * @returns {string} Readable format "Esc. 1, Piso 3, Pta. B"
 */
export const formatApartment = (apartmentStr) => {
  if (!apartmentStr) return '';
  const parsed = parseApartment(apartmentStr);
  if (!parsed) return apartmentStr;
  return `Esc. ${parsed.stair}, Piso ${parsed.floor}, Pta. ${parsed.door}`;
};

/**
 * Parse apartment from stored format
 * @param {string} apartmentStr - Format "1-3-B"
 * @returns {object|null} { stair, floor, door } or null if invalid format
 */
export const parseApartment = (apartmentStr) => {
  if (!apartmentStr) return null;
  const match = apartmentStr.match(/^(\d+)-(\d+)-([A-M])$/);
  if (!match) return null;
  return {
    stair: match[1],
    floor: match[2],
    door: match[3],
    // Legacy property names for backwards compatibility
    escalera: match[1],
    piso: match[2],
    puerta: match[3],
  };
};

/**
 * Combine stair, floor, and door into stored format
 * @returns {string} Format "1-3-B"
 */
export const combineApartment = (stair, floor, door) => {
  return `${stair}-${floor}-${door}`;
};

/**
 * Verify if an apartment has valid structured format
 * @param {string} apartmentStr - The apartment to verify
 * @returns {boolean}
 */
export const isValidApartment = (apartmentStr) => {
  return parseApartment(apartmentStr) !== null;
};

// Legacy exports for backwards compatibility
// TODO: Remove these aliases once all consumers are updated
export const HORARIOS_CONFIG = {
  horaApertura: SCHEDULE_CONFIG.openingTime,
  horaCierre: SCHEDULE_CONFIG.closingTime,
  duracionBloque: SCHEDULE_CONFIG.slotDuration,
};
export const DURACION_BLOQUE = SLOT_DURATION;
export const LIMITES_RESERVA = {
  maxReservasActivas: RESERVATION_LIMITS.maxActiveReservations,
  horasAnticipacionMinima: RESERVATION_LIMITS.minAdvanceHours,
  diasAnticipacionMaxima: RESERVATION_LIMITS.maxAdvanceDays,
  horasCancelacionMinima: RESERVATION_LIMITS.minCancellationHours,
};
export const PRIORIDAD_LABELS = PRIORITY_LABELS;
export const NIVELES_JUEGO = PLAY_LEVELS;
export const CLASE_CONFIG = {
  ...CLASS_CONFIG,
  // Legacy property names for backwards compatibility
  MIN_ALUMNOS: CLASS_CONFIG.MIN_STUDENTS,
  MAX_ALUMNOS: CLASS_CONFIG.MAX_STUDENTS,
  OPCIONES_MIN: CLASS_CONFIG.MIN_OPTIONS,
  OPCIONES_MAX: CLASS_CONFIG.MAX_OPTIONS,
};
export const VIVIENDA_CONFIG = {
  escaleras: APARTMENT_CONFIG.stairs,
  pisos: APARTMENT_CONFIG.floors,
  puertas: APARTMENT_CONFIG.doors,
};
export const formatearVivienda = formatApartment;
export const parseVivienda = parseApartment;
export const combinarVivienda = combineApartment;
export const esViviendaValida = isValidApartment;
