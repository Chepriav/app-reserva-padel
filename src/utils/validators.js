import { LIMITES_RESERVA, esViviendaValida, VIVIENDA_CONFIG } from '../constants/config';
import { horasHasta } from './dateHelpers';

// Validar formato de email
export const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Validar teléfono (formato flexible)
export const validarTelefono = (telefono) => {
  // Acepta números de 9 dígitos o más
  const soloNumeros = telefono.replace(/\s/g, '').replace(/\+/g, '').replace(/-/g, '');
  return soloNumeros.length >= 9 && /^\d+$/.test(soloNumeros);
};

// Validar componentes de vivienda (escalera, piso, puerta)
export const validarViviendaComponentes = (escalera, piso, puerta) => {
  const errores = {};

  if (!escalera) {
    errores.escalera = 'Selecciona una escalera';
  } else if (!VIVIENDA_CONFIG.escaleras.includes(Number(escalera))) {
    errores.escalera = 'Escalera no válida';
  }

  if (!piso) {
    errores.piso = 'Selecciona un piso';
  } else if (!VIVIENDA_CONFIG.pisos.includes(Number(piso))) {
    errores.piso = 'Piso no válido';
  }

  if (!puerta) {
    errores.puerta = 'Selecciona una puerta';
  } else if (!VIVIENDA_CONFIG.puertas.includes(puerta)) {
    errores.puerta = 'Puerta no válida';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
};

// Validar si el usuario puede hacer una nueva reserva
// NOTA: La validación principal de límites se hace en el backend (reservasService)
// Esta función solo hace validaciones básicas del frontend
export const puedeReservar = (usuario, nuevaReserva, reservasActuales) => {
  // Verificar que la fecha/hora sea futura
  const horasAnticipacion = horasHasta(nuevaReserva.fecha, nuevaReserva.horaInicio);

  if (horasAnticipacion < 0) {
    return {
      valido: false,
      error: 'No puedes reservar en horarios pasados',
    };
  }

  // 2. Verificar límite de reservas activas de la VIVIENDA (solo futuras)
  const ahora = new Date();
  const reservasActivasVivienda = reservasActuales.filter((r) => {
    // Filtrar por vivienda, estado confirmada, y que sea futura
    const esMismaVivienda = r.vivienda === usuario.vivienda;
    const esConfirmada = r.estado === 'confirmada';
    const fechaReserva = new Date(r.fecha + 'T' + r.horaInicio);
    const esFutura = fechaReserva > ahora;
    return esMismaVivienda && esConfirmada && esFutura;
  });

  if (reservasActivasVivienda.length >= LIMITES_RESERVA.maxReservasActivas) {
    return {
      valido: false,
      error: `Tu vivienda ya tiene ${LIMITES_RESERVA.maxReservasActivas} reservas activas`,
    };
  }

  // 3. Verificar que la vivienda no tenga otra reserva a la misma hora
  const conflicto = reservasActivasVivienda.find(
    (r) =>
      r.fecha === nuevaReserva.fecha &&
      r.horaInicio === nuevaReserva.horaInicio
  );
  if (conflicto) {
    return {
      valido: false,
      error: 'Tu vivienda ya tiene una reserva a esta hora',
    };
  }

  return { valido: true };
};

// Validar si se puede cancelar una reserva
export const puedeCancelar = (reserva) => {
  const horasRestantes = horasHasta(reserva.fecha, reserva.horaInicio);
  if (horasRestantes < LIMITES_RESERVA.horasCancelacionMinima) {
    return {
      valido: false,
      error: `Solo puedes cancelar con al menos ${LIMITES_RESERVA.horasCancelacionMinima} horas de anticipación`,
    };
  }
  return { valido: true };
};

// Validar datos de registro
export const validarRegistro = (datos) => {
  const errores = {};

  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!validarEmail(datos.email)) {
    errores.email = 'Email no válido';
  }

  if (!validarTelefono(datos.telefono)) {
    errores.telefono = 'Teléfono no válido';
  }

  // Validar vivienda estructurada
  if (!datos.vivienda || !esViviendaValida(datos.vivienda)) {
    errores.vivienda = 'Debes seleccionar tu vivienda completa';
  }

  if (!datos.password || datos.password.length < 6) {
    errores.password = 'La contraseña debe tener al menos 6 caracteres';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
};

// Validar datos de perfil
export const validarPerfil = (datos) => {
  const errores = {};

  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.nombre = 'El nombre debe tener al menos 2 caracteres';
  }

  if (!validarTelefono(datos.telefono)) {
    errores.telefono = 'Teléfono no válido';
  }

  // Validar vivienda estructurada
  if (!datos.vivienda || !esViviendaValida(datos.vivienda)) {
    errores.vivienda = 'Debes seleccionar tu vivienda completa';
  }

  // nivelJuego is optional, but if provided must be valid
  const nivelesValidos = ['principiante', 'intermedio', 'avanzado', 'profesional'];
  if (datos.nivelJuego && !nivelesValidos.includes(datos.nivelJuego)) {
    errores.nivelJuego = 'Nivel de juego no válido';
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
  };
};
