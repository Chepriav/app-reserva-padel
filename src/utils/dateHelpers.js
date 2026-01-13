import { SCHEDULE_CONFIG } from '../constants/config';

// Convert date and time strings to Date object
export const stringToDate = (date, time) => {
  const [year, month, day] = date.split('-');
  const [hours, minutes] = time.split(':');
  return new Date(year, month - 1, day, hours, minutes);
};

// Format date to YYYY-MM-DD
export const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format date to readable format (e.g., "Lunes 25 de Diciembre")
export const formatReadableDate = (dateInput) => {
  if (!dateInput) return 'Fecha no disponible';

  let date;
  if (typeof dateInput === 'string') {
    // If it's a full ISO timestamp (contains T or Z), parse directly
    if (dateInput.includes('T') || dateInput.includes('Z')) {
      date = new Date(dateInput);
    } else {
      // If it's just YYYY-MM-DD
      date = new Date(dateInput + 'T00:00:00');
    }
  } else if (dateInput.toDate && typeof dateInput.toDate === 'function') {
    // Firebase Timestamp
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Fecha inválida';
  }

  // Verify the date is valid
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
};

// Generate available time slots for the day
// Accepts optional config for custom opening/closing times and break periods
export const generateAvailableSlots = (config = null, date = null) => {
  const slots = [];

  let openingTime, closingTime;

  // Check if using differentiated schedules (weekday vs weekend)
  if (config?.usarHorariosDiferenciados) {
    // Determine day of week
    const dateObj = date ? (typeof date === 'string' ? new Date(date + 'T00:00:00') : date) : new Date();
    const dayOfWeek = dateObj.getDay(); // 0=Sunday, 1-5=Monday-Friday, 6=Saturday

    // 0 (Sunday) and 6 (Saturday) = weekend
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (isWeekend) {
      openingTime = config.findeHoraApertura || SCHEDULE_CONFIG.openingTime;
      closingTime = config.findeHoraCierre || SCHEDULE_CONFIG.closingTime;
    } else {
      // Monday-Friday
      openingTime = config.semanaHoraApertura || SCHEDULE_CONFIG.openingTime;
      closingTime = config.semanaHoraCierre || SCHEDULE_CONFIG.closingTime;
    }
  } else {
    // Unified mode (current behavior)
    openingTime = config?.horaApertura || SCHEDULE_CONFIG.openingTime;
    closingTime = config?.horaCierre || SCHEDULE_CONFIG.closingTime;
  }

  const duration = config?.duracionBloque || SCHEDULE_CONFIG.slotDuration;

  const [openingHour] = openingTime.split(':').map(Number);
  const [closingHour] = closingTime.split(':').map(Number);

  let currentMinutes = openingHour * 60; // Convert to minutes
  const closingMinutes = closingHour * 60;

  while (currentMinutes + duration <= closingMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const minutes = currentMinutes % 60;
    const startTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const endMinutes = currentMinutes + duration;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;

    // Skip slots that fall within break time (if configured)
    const isInBreakTime = shouldSkipSlot(startTime, endTime, config, date);

    if (!isInBreakTime) {
      slots.push({
        horaInicio: startTime,
        horaFin: endTime,
      });
    }

    currentMinutes += duration;
  }

  return slots;
};

// Helper function to check if a slot should be skipped due to break time
const shouldSkipSlot = (slotStart, slotEnd, config, date) => {
  if (!config?.pausaInicio || !config?.pausaFin) {
    return false; // No break configured
  }

  // Check if break applies to this day of week
  if (config.pausaDiasSemana && Array.isArray(config.pausaDiasSemana)) {
    const dateObj = date ? (typeof date === 'string' ? new Date(date + 'T00:00:00') : date) : new Date();
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

    if (!config.pausaDiasSemana.includes(dayOfWeek)) {
      return false; // Break doesn't apply to this day
    }
  }

  // Convert times to minutes for comparison
  const timeToMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const slotStartMin = timeToMinutes(slotStart);
  const slotEndMin = timeToMinutes(slotEnd);
  const breakStartMin = timeToMinutes(config.pausaInicio);
  const breakEndMin = timeToMinutes(config.pausaFin);

  // Slot overlaps with break if it starts, ends, or contains the break period
  return (
    (slotStartMin >= breakStartMin && slotStartMin < breakEndMin) ||
    (slotEndMin > breakStartMin && slotEndMin <= breakEndMin) ||
    (slotStartMin <= breakStartMin && slotEndMin >= breakEndMin)
  );
};

// Check if date/time is in the future
export const isFuture = (date, time) => {
  const dateTime = stringToDate(date, time);
  return dateTime > new Date();
};

// Check if a time slot has ended (uses end time)
// The slot is active as long as it hasn't ended
export const hasSlotEnded = (date, endTime) => {
  const endDateTime = stringToDate(date, endTime);
  return endDateTime <= new Date();
};

// Calculate hours from now until date/time
export const hoursUntil = (date, time) => {
  const dateTime = stringToDate(date, time);
  const now = new Date();
  const difference = dateTime - now;
  return difference / (1000 * 60 * 60); // Convert ms to hours
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  return formatDate(new Date());
};

// Format time to show only HH:MM (without seconds)
export const formatTime = (time) => {
  if (!time) return '';
  // If it has seconds (HH:MM:SS), remove them
  return time.split(':').slice(0, 2).join(':');
};

// Check if a date is within the allowed booking range
export const isDateValid = (date) => {
  const dateObj = new Date(date + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 7); // 7 days ahead
  maxDate.setHours(0, 0, 0, 0);

  return dateObj >= today && dateObj <= maxDate;
};

// Legacy exports for backwards compatibility
// TODO: Remove these aliases once all consumers are updated
export const formatearFecha = formatDate;
export const formatearFechaLegible = formatReadableDate;
export const generarHorariosDisponibles = generateAvailableSlots;
export const esFuturo = isFuture;
export const bloqueTerminado = hasSlotEnded;
export const horasHasta = hoursUntil;
export const obtenerFechaHoy = getTodayDate;
export const formatearHora = formatTime;
export const esFechaValida = isDateValid;
