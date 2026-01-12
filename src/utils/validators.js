import { RESERVATION_LIMITS, isValidApartment, APARTMENT_CONFIG, LIMITES_RESERVA, esViviendaValida, VIVIENDA_CONFIG } from '../constants/config';
import { hoursUntil, horasHasta } from './dateHelpers';

// Validate email format
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validate phone number (flexible format)
export const validatePhone = (phone) => {
  // Accepts 9+ digit numbers
  const digitsOnly = phone.replace(/\s/g, '').replace(/\+/g, '').replace(/-/g, '');
  return digitsOnly.length >= 9 && /^\d+$/.test(digitsOnly);
};

// Validate apartment components (stair, floor, door)
export const validateApartmentComponents = (stair, floor, door) => {
  const errors = {};

  if (!stair) {
    errors.escalera = 'Selecciona una escalera';
  } else if (!APARTMENT_CONFIG.stairs.includes(Number(stair))) {
    errors.escalera = 'Escalera no válida';
  }

  if (!floor) {
    errors.piso = 'Selecciona un piso';
  } else if (!APARTMENT_CONFIG.floors.includes(Number(floor))) {
    errors.piso = 'Piso no válido';
  }

  if (!door) {
    errors.puerta = 'Selecciona una puerta';
  } else if (!APARTMENT_CONFIG.doors.includes(door)) {
    errors.puerta = 'Puerta no válida';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    // Legacy property for backwards compatibility
    valido: Object.keys(errors).length === 0,
    errores: errors,
  };
};

// Check if user can make a new reservation
// NOTE: Main limit validation is done in backend (reservasService)
// This function only performs basic frontend validations
export const canMakeReservation = (user, newReservation, currentReservations) => {
  // Verify the date/time is in the future
  const hoursInAdvance = hoursUntil(newReservation.fecha, newReservation.horaInicio);

  if (hoursInAdvance < 0) {
    return {
      valid: false,
      valido: false,
      error: 'No puedes reservar en horarios pasados',
    };
  }

  // 2. Check apartment's active reservations limit (only future ones)
  const now = new Date();
  const apartmentActiveReservations = currentReservations.filter((r) => {
    // Filter by apartment, confirmed status, and future date
    const sameApartment = r.vivienda === user.vivienda;
    const isConfirmed = r.estado === 'confirmada';
    const reservationDate = new Date(r.fecha + 'T' + r.horaInicio);
    const isFuture = reservationDate > now;
    return sameApartment && isConfirmed && isFuture;
  });

  if (apartmentActiveReservations.length >= RESERVATION_LIMITS.maxActiveReservations) {
    return {
      valid: false,
      valido: false,
      error: `Tu vivienda ya tiene ${RESERVATION_LIMITS.maxActiveReservations} reservas activas`,
    };
  }

  // 3. Check if apartment doesn't have another reservation at the same time
  const conflict = apartmentActiveReservations.find(
    (r) =>
      r.fecha === newReservation.fecha &&
      r.horaInicio === newReservation.horaInicio
  );
  if (conflict) {
    return {
      valid: false,
      valido: false,
      error: 'Tu vivienda ya tiene una reserva a esta hora',
    };
  }

  return { valid: true, valido: true };
};

// Check if a reservation can be cancelled
export const canCancelReservation = (reservation) => {
  // No time restriction - always allow cancellation
  return { valid: true, valido: true };
};

// Validate registration data
export const validateRegistration = (data) => {
  const errors = {};

  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Email no válido';
  }

  if (!validatePhone(data.telefono)) {
    errors.telefono = 'Teléfono no válido';
  }

  // Validate structured apartment
  if (!data.vivienda || !isValidApartment(data.vivienda)) {
    errors.vivienda = 'Debes seleccionar tu vivienda completa';
  }

  if (!data.password || data.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return {
    valid: Object.keys(errors).length === 0,
    valido: Object.keys(errors).length === 0,
    errors,
    errores: errors,
  };
};

// Validate profile data
export const validateProfile = (data) => {
  const errors = {};

  if (!data.nombre || data.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!validatePhone(data.telefono)) {
    errors.telefono = 'Teléfono no válido';
  }

  // Validate structured apartment
  if (!data.vivienda || !isValidApartment(data.vivienda)) {
    errors.vivienda = 'Debes seleccionar tu vivienda completa';
  }

  // nivelJuego is optional, but if provided must be valid
  const validLevels = ['principiante', 'intermedio', 'avanzado', 'profesional'];
  if (data.nivelJuego && !validLevels.includes(data.nivelJuego)) {
    errors.nivelJuego = 'Nivel de juego no válido';
  }

  return {
    valid: Object.keys(errors).length === 0,
    valido: Object.keys(errors).length === 0,
    errors,
    errores: errors,
  };
};

// Legacy exports for backwards compatibility
// TODO: Remove these aliases once all consumers are updated
export const validarEmail = validateEmail;
export const validarTelefono = validatePhone;
export const validarViviendaComponentes = validateApartmentComponents;
export const puedeReservar = canMakeReservation;
export const puedeCancelar = canCancelReservation;
export const validarRegistro = validateRegistration;
export const validarPerfil = validateProfile;
