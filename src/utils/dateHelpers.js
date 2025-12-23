import { HORARIOS_CONFIG } from '../constants/config';

// Convertir fecha y hora a objeto Date
export const stringToDate = (fecha, hora) => {
  const [year, month, day] = fecha.split('-');
  const [hours, minutes] = hora.split(':');
  return new Date(year, month - 1, day, hours, minutes);
};

// Formatear fecha a YYYY-MM-DD
export const formatearFecha = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Formatear fecha a formato legible (ej: "Lunes 25 de Diciembre")
export const formatearFechaLegible = (fecha) => {
  if (!fecha) return 'Fecha no disponible';

  let date;
  if (typeof fecha === 'string') {
    // Si es un timestamp ISO completo (contiene T o Z), parsearlo directamente
    if (fecha.includes('T') || fecha.includes('Z')) {
      date = new Date(fecha);
    } else {
      // Si es solo fecha YYYY-MM-DD
      date = new Date(fecha + 'T00:00:00');
    }
  } else if (fecha.toDate && typeof fecha.toDate === 'function') {
    // Firebase Timestamp
    date = fecha.toDate();
  } else if (fecha instanceof Date) {
    date = fecha;
  } else {
    return 'Fecha inválida';
  }

  // Verificar que la fecha sea válida
  if (isNaN(date.getTime())) {
    return 'Fecha inválida';
  }

  const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('es-ES', opciones);
};

// Generar horarios disponibles del día
export const generarHorariosDisponibles = () => {
  const horarios = [];
  const [horaInicio] = HORARIOS_CONFIG.horaApertura.split(':').map(Number);
  const [horaFin] = HORARIOS_CONFIG.horaCierre.split(':').map(Number);
  const duracion = HORARIOS_CONFIG.duracionBloque;

  let horaActual = horaInicio * 60; // Convertir a minutos
  const horaFinMinutos = horaFin * 60;

  while (horaActual + duracion <= horaFinMinutos) {
    const horas = Math.floor(horaActual / 60);
    const minutos = horaActual % 60;
    const horaStr = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    const horaFinBloque = horaActual + duracion;
    const horasFinBloque = Math.floor(horaFinBloque / 60);
    const minutosFinBloque = horaFinBloque % 60;
    const horaFinStr = `${String(horasFinBloque).padStart(2, '0')}:${String(minutosFinBloque).padStart(2, '0')}`;

    horarios.push({
      horaInicio: horaStr,
      horaFin: horaFinStr,
    });

    horaActual += duracion;
  }

  return horarios;
};

// Validar si fecha/hora es futura
export const esFuturo = (fecha, hora) => {
  const fechaHora = stringToDate(fecha, hora);
  return fechaHora > new Date();
};

// Calcular diferencia en horas desde ahora hasta fecha/hora
export const horasHasta = (fecha, hora) => {
  const fechaHora = stringToDate(fecha, hora);
  const ahora = new Date();
  const diferencia = fechaHora - ahora;
  return diferencia / (1000 * 60 * 60); // Convertir ms a horas
};

// Obtener fecha de hoy en formato YYYY-MM-DD
export const obtenerFechaHoy = () => {
  return formatearFecha(new Date());
};

// Formatear hora para mostrar solo HH:MM (sin segundos)
export const formatearHora = (hora) => {
  if (!hora) return '';
  // Si viene con segundos (HH:MM:SS), quitar los segundos
  return hora.split(':').slice(0, 2).join(':');
};

// Validar si una fecha está dentro del rango permitido
export const esFechaValida = (fecha) => {
  const fechaObj = new Date(fecha + 'T00:00:00');
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const maxFecha = new Date();
  maxFecha.setDate(maxFecha.getDate() + 7); // 7 días adelante
  maxFecha.setHours(0, 0, 0, 0);

  return fechaObj >= hoy && fechaObj <= maxFecha;
};
