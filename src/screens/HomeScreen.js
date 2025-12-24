import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useReservas } from '../context/ReservasContext';
import { colors } from '../constants/colors';
import {
  obtenerFechaHoy,
  formatearFechaLegible,
  esFechaValida,
  bloqueTerminado,
} from '../utils/dateHelpers';
import { puedeReservar } from '../utils/validators';
import { CustomAlert } from '../components/CustomAlert';

export default function HomeScreen({ navigation }) {
  const { user, notificacionesPendientes, marcarNotificacionesLeidas } = useAuth();
  const { pistas, crearReserva, obtenerDisponibilidad, reservas } =
    useReservas();
  const [fechaSeleccionada, setFechaSeleccionada] = useState(obtenerFechaHoy());
  const [pistaSeleccionada, setPistaSeleccionada] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [reservando, setReservando] = useState(false);
  const [vistaActual, setVistaActual] = useState('dia'); // 'dia' o 'semana'
  const [horariosSemanales, setHorariosSemanales] = useState({}); // { '2025-01-15': [...horarios], ... }
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]); // Array de horarios seleccionados
  const [notificacionMostrada, setNotificacionMostrada] = useState(false);

  // Estado para el CustomAlert
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Mostrar notificación de desplazamiento al entrar
  useEffect(() => {
    if (notificacionesPendientes.length > 0 && !notificacionMostrada) {
      const notif = notificacionesPendientes[0];
      setNotificacionMostrada(true);
      setAlertConfig({
        visible: true,
        title: 'Reserva Desplazada',
        message: `Tu reserva provisional del ${formatearFechaLegible(notif.fechaReserva)} a las ${notif.horaInicio} en ${notif.pistaNombre} fue desplazada por otra vivienda.\n\nPuedes hacer una nueva reserva cuando quieras.`,
        buttons: [
          {
            text: 'Entendido',
            onPress: () => {
              marcarNotificacionesLeidas();
            },
          },
        ],
      });
    }
  }, [notificacionesPendientes, notificacionMostrada]);

  // Funciones helper para mostrar alerts
  const mostrarAlerta = (title, message) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [{ text: 'OK', onPress: () => {} }],
    });
  };

  const mostrarConfirmacion = (title, message, onConfirm) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        { text: 'Confirmar', onPress: onConfirm },
      ],
    });
  };

  // Seleccionar automáticamente la primera pista cuando se carguen
  useEffect(() => {
    if (pistas.length > 0 && !pistaSeleccionada) {
      setPistaSeleccionada(pistas[0]);
    }
  }, [pistas]);

  useEffect(() => {
    // Limpiar selección cuando cambia fecha o vista
    setBloquesSeleccionados([]);

    if (pistaSeleccionada) {
      if (vistaActual === 'dia') {
        cargarHorarios();
      } else {
        cargarHorariosSemana();
      }
    }
  }, [pistaSeleccionada, fechaSeleccionada, vistaActual]);

  const cargarHorarios = async () => {
    if (!pistaSeleccionada) return;

    setLoadingHorarios(true);

    try {
      const result = await obtenerDisponibilidad(
        pistaSeleccionada.id,
        fechaSeleccionada
      );
      setLoadingHorarios(false);

      if (result.success) {
        setHorarios(result.data);
      } else {
        mostrarAlerta(
          'Error al cargar horarios',
          result.error || 'No se pudieron cargar los horarios.\n\n⚠️ Asegúrate de que Firebase esté configurado correctamente en Firebase Console.'
        );
        setHorarios([]);
      }
    } catch (error) {
      setLoadingHorarios(false);
      mostrarAlerta(
        'Error de conexión',
        'No se pudieron cargar los horarios.\n\n⚠️ Verifica que Firebase esté configurado:\n• Authentication habilitada\n• Firestore Database creada\n• Security Rules publicadas\n• Índices creados\n\nConsulta PASOS_FINALES.md'
      );
      setHorarios([]);
    }
  };

  // Función para seleccionar/deseleccionar un bloque horario
  const toggleBloqueSeleccionado = (horario, fechaReserva = null) => {
    const fechaAUsar = fechaReserva || fechaSeleccionada;

    // Verificar si el bloque ya está seleccionado
    const yaSeleccionado = bloquesSeleccionados.some(b =>
      b.fecha === fechaAUsar && b.horaInicio === horario.horaInicio
    );

    if (yaSeleccionado) {
      // Deseleccionar
      setBloquesSeleccionados(bloquesSeleccionados.filter(b =>
        !(b.fecha === fechaAUsar && b.horaInicio === horario.horaInicio)
      ));
      return;
    }

    // Limitar a 3 bloques (1.5 horas)
    if (bloquesSeleccionados.length >= 3) {
      mostrarAlerta('Máximo 3 bloques', 'Solo puedes seleccionar hasta 3 bloques consecutivos (1.5 horas)');
      return;
    }

    // Agregar el nuevo bloque
    const nuevoBloque = {
      fecha: fechaAUsar,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
    };

    const nuevaSeleccion = [...bloquesSeleccionados, nuevoBloque];

    // Validar que los bloques sean consecutivos y de la misma fecha
    if (!sonBloquesConsecutivos(nuevaSeleccion)) {
      mostrarAlerta('Bloques no consecutivos', 'Los bloques deben ser consecutivos y del mismo día');
      return;
    }

    setBloquesSeleccionados(nuevaSeleccion);
  };

  // Validar que los bloques sean consecutivos
  const sonBloquesConsecutivos = (bloques) => {
    if (bloques.length <= 1) return true;

    // Verificar que todos sean de la misma fecha
    const primeraFecha = bloques[0].fecha;
    if (!bloques.every(b => b.fecha === primeraFecha)) {
      return false;
    }

    // Ordenar bloques por hora de inicio
    const bloquesOrdenados = [...bloques].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio)
    );

    // Verificar que sean consecutivos
    for (let i = 0; i < bloquesOrdenados.length - 1; i++) {
      if (bloquesOrdenados[i].horaFin !== bloquesOrdenados[i + 1].horaInicio) {
        return false;
      }
    }

    return true;
  };

  // Limpiar selección
  const limpiarSeleccion = () => {
    setBloquesSeleccionados([]);
  };

  // Manejar selección de horario desplazable (reserva provisional de otro)
  const handleSeleccionarDesplazable = (horario, fechaReserva = null) => {
    const fechaAUsar = fechaReserva || fechaSeleccionada;

    setAlertConfig({
      visible: true,
      title: 'Reserva Provisional',
      message: `Este horario tiene una reserva provisional de otra vivienda.\n\nSi reservas aquí, desplazarás esa reserva y la tuya será GARANTIZADA.\n\n¿Deseas continuar?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Desplazar y Reservar',
          style: 'destructive',
          onPress: () => confirmarReservaConDesplazamiento(horario, fechaAUsar),
        },
      ],
    });
  };

  // Confirmar reserva desplazando otra
  const confirmarReservaConDesplazamiento = async (horario, fechaReserva) => {
    if (!user || !pistaSeleccionada) return;

    setReservando(true);
    const result = await crearReserva({
      pistaId: pistaSeleccionada.id,
      fecha: fechaReserva,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      jugadores: [],
      forzarDesplazamiento: true,
    });
    setReservando(false);

    if (result.success) {
      mostrarAlerta(
        '¡Reserva confirmada!',
        'Tu reserva GARANTIZADA se ha creado correctamente.\nLa reserva provisional anterior ha sido desplazada.'
      );
      limpiarSeleccion();
      if (vistaActual === 'dia') {
        cargarHorarios();
      } else {
        cargarHorariosSemana();
      }
    } else {
      mostrarAlerta('Error', result.error);
    }
  };

  // Función para confirmar la reserva de los bloques seleccionados
  const confirmarReserva = async () => {
    if (bloquesSeleccionados.length === 0) {
      mostrarAlerta('Selecciona horarios', 'Debes seleccionar al menos un bloque de 30 minutos');
      return;
    }

    // Validar que el usuario esté autenticado
    if (!user) {
      mostrarAlerta('Error', 'Debes iniciar sesión para hacer una reserva');
      return;
    }

    if (!pistaSeleccionada) {
      mostrarAlerta('Error', 'Selecciona una pista primero');
      return;
    }

    // Ordenar bloques para obtener hora inicio y fin
    const bloquesOrdenados = [...bloquesSeleccionados].sort((a, b) =>
      a.horaInicio.localeCompare(b.horaInicio)
    );

    const horaInicio = bloquesOrdenados[0].horaInicio;
    const horaFin = bloquesOrdenados[bloquesOrdenados.length - 1].horaFin;
    const fechaReserva = bloquesOrdenados[0].fecha;

    // Validar si el usuario puede reservar
    const validacion = puedeReservar(
      user,
      {
        fecha: fechaReserva,
        horaInicio: horaInicio,
        pistaId: pistaSeleccionada.id,
      },
      reservas
    );

    if (!validacion.valido) {
      mostrarAlerta('No se puede reservar', validacion.error);
      return;
    }

    // Confirmar reserva
    const duracionMinutos = bloquesSeleccionados.length * 30;
    const duracionTexto = duracionMinutos === 30 ? '30 minutos' :
                         duracionMinutos === 60 ? '1 hora' : '1.5 horas';

    mostrarConfirmacion(
      'Confirmar Reserva',
      `¿Reservar ${pistaSeleccionada.nombre} el ${formatearFechaLegible(
        fechaReserva
      )} de ${horaInicio} a ${horaFin}?\n\nDuración: ${duracionTexto} (${bloquesSeleccionados.length} bloques)`,
      async () => {
        setReservando(true);
        const result = await crearReserva({
          pistaId: pistaSeleccionada.id,
          fecha: fechaReserva,
          horaInicio: horaInicio,
          horaFin: horaFin,
          jugadores: [],
        });
        setReservando(false);

        if (result.success) {
          mostrarAlerta(
            '¡Reserva confirmada!',
            'Tu reserva se ha creado correctamente'
          );
          // Limpiar selección
          limpiarSeleccion();
          // Actualizar la fecha seleccionada si se reservó desde vista semana
          if (fechaReserva !== fechaSeleccionada) {
            setFechaSeleccionada(fechaReserva);
          }
          // Recargar horarios
          if (vistaActual === 'dia') {
            cargarHorarios();
          } else {
            cargarHorariosSemana();
          }
        } else {
          mostrarAlerta('Error', result.error);
        }
      }
    );
  };

  const cargarHorariosSemana = async () => {
    if (!pistaSeleccionada) return;

    setLoadingHorarios(true);

    try {
      const horariosTemp = {};

      // Obtener el lunes de la semana actual
      const [año, mes, dia] = fechaSeleccionada.split('-').map(Number);
      const fechaActual = new Date(Date.UTC(año, mes - 1, dia));

      // Calcular qué día de la semana es (0 = domingo, 1 = lunes, ..., 6 = sábado)
      const diaSemana = fechaActual.getUTCDay();

      // Calcular cuántos días hay que restar para llegar al lunes
      // Si es domingo (0), restar 6 días; si es lunes (1), restar 0; si es martes (2), restar 1, etc.
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;

      // Calcular la fecha del lunes
      const lunes = new Date(fechaActual);
      lunes.setUTCDate(fechaActual.getUTCDate() - diasHastaLunes);

      // Cargar horarios de lunes a domingo (7 días)
      for (let i = 0; i < 7; i++) {
        const fecha = new Date(lunes);
        fecha.setUTCDate(lunes.getUTCDate() + i);
        const fechaStr = fecha.toISOString().split('T')[0];

        if (esFechaValida(fechaStr)) {
          const result = await obtenerDisponibilidad(pistaSeleccionada.id, fechaStr);
          if (result.success) {
            horariosTemp[fechaStr] = result.data;
          }
        }
      }

      setHorariosSemanales(horariosTemp);
      setLoadingHorarios(false);
    } catch (error) {
      setLoadingHorarios(false);
      mostrarAlerta('Error', 'No se pudieron cargar los horarios de la semana');
      setHorariosSemanales({});
    }
  };

  const cambiarFecha = (dias) => {
    const [año, mes, dia] = fechaSeleccionada.split('-').map(Number);
    const fecha = new Date(Date.UTC(año, mes - 1, dia));

    if (vistaActual === 'semana') {
      // En vista semana: Cambiar a la semana siguiente/anterior
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      // Encontrar el lunes de la semana actual de fechaSeleccionada
      const diaSemana = fecha.getUTCDay();
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
      const lunesSeleccionado = new Date(fecha);
      lunesSeleccionado.setUTCDate(fecha.getUTCDate() - diasHastaLunes);

      // Encontrar el lunes de la semana actual (hoy)
      const diaSemanaHoy = hoy.getDay();
      const diasHastaLunesHoy = diaSemanaHoy === 0 ? 6 : diaSemanaHoy - 1;
      const lunesDeEstaSemanaMundial = new Date(hoy);
      lunesDeEstaSemanaMundial.setDate(hoy.getDate() - diasHastaLunesHoy);
      lunesDeEstaSemanaMundial.setHours(0, 0, 0, 0);

      // Calcular nueva semana
      const nuevaSemana = new Date(lunesSeleccionado);
      nuevaSemana.setUTCDate(lunesSeleccionado.getUTCDate() + (dias * 7));

      // Validar que la nueva semana esté dentro del rango permitido
      // Solo permitir semana actual y siguiente (máximo 14 días desde hoy)
      const lunesSiguienteSemana = new Date(lunesDeEstaSemanaMundial);
      lunesSiguienteSemana.setDate(lunesDeEstaSemanaMundial.getDate() + 7);

      const nuevaFechaStr = nuevaSemana.toISOString().split('T')[0];
      const nuevaFechaObj = new Date(nuevaFechaStr + 'T00:00:00');

      // No permitir ir hacia atrás antes de la semana actual
      if (nuevaFechaObj < lunesDeEstaSemanaMundial) {
        mostrarAlerta(
          'Semana no disponible',
          'No puedes ver semanas anteriores a la actual'
        );
        return;
      }

      // No permitir ir más allá de la siguiente semana
      const maxFecha = new Date(lunesSiguienteSemana);
      maxFecha.setDate(maxFecha.getDate() + 6); // Domingo de la siguiente semana

      if (nuevaFechaObj > maxFecha) {
        mostrarAlerta(
          'Límite alcanzado',
          'Solo puedes ver la semana actual y la siguiente'
        );
        return;
      }

      setFechaSeleccionada(nuevaFechaStr);
    } else {
      // En vista día: Cambiar un día
      fecha.setUTCDate(fecha.getUTCDate() + dias);

      const nuevaFecha = fecha.toISOString().split('T')[0];

      if (esFechaValida(nuevaFecha)) {
        setFechaSeleccionada(nuevaFecha);
      } else {
        mostrarAlerta(
          'Fecha no válida',
          'Solo puedes reservar hasta 7 días de anticipación'
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, {user?.nombre}</Text>
          <Text style={styles.subtitle}>Selecciona pista y horario</Text>
        </View>

      {/* Selector de Vista Día/Semana */}
      <View style={styles.vistaSelector}>
        <TouchableOpacity
          style={[
            styles.vistaBotón,
            vistaActual === 'dia' && styles.vistaBotónActivo,
          ]}
          onPress={() => setVistaActual('dia')}
        >
          <Text
            style={[
              styles.vistaBotónTexto,
              vistaActual === 'dia' && styles.vistaBotónTextoActivo,
            ]}
          >
            Día
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.vistaBotón,
            vistaActual === 'semana' && styles.vistaBotónActivo,
          ]}
          onPress={() => setVistaActual('semana')}
        >
          <Text
            style={[
              styles.vistaBotónTexto,
              vistaActual === 'semana' && styles.vistaBotónTextoActivo,
            ]}
          >
            Semana
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selector de Fecha */}
      <View style={styles.fechaContainer}>
        <TouchableOpacity
          style={styles.fechaButton}
          onPress={() => cambiarFecha(-1)}
        >
          <Text style={styles.fechaButtonText}>←</Text>
        </TouchableOpacity>

        <View style={styles.fechaInfo}>
          <Text style={styles.fechaText}>
            {vistaActual === 'dia'
              ? formatearFechaLegible(fechaSeleccionada)
              : 'Semana del ' + formatearFechaLegible(fechaSeleccionada)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.fechaButton}
          onPress={() => cambiarFecha(1)}
        >
          <Text style={styles.fechaButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Pistas - Solo mostrar si hay más de una */}
      {pistas.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pistas Disponibles</Text>
          {pistas.map((pista) => (
            <TouchableOpacity
              key={pista.id}
              style={[
                styles.pistaCard,
                pistaSeleccionada?.id === pista.id && styles.pistaCardSelected,
              ]}
              onPress={() => setPistaSeleccionada(pista)}
            >
              <Text style={styles.pistaNombre}>{pista.nombre}</Text>
              <Text style={styles.pistaDescripcion}>{pista.descripcion}</Text>
              <View style={styles.pistaFeatures}>
                {pista.techada && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Techada</Text>
                  </View>
                )}
                {pista.conLuz && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Con Luz</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Horarios */}
      {pistaSeleccionada && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {vistaActual === 'dia' ? 'Horarios Disponibles' : 'Horarios de la Semana'}
            </Text>
            {bloquesSeleccionados.length > 0 && (
              <TouchableOpacity
                style={styles.limpiarButton}
                onPress={limpiarSeleccion}
              >
                <Text style={styles.limpiarText}>Limpiar</Text>
              </TouchableOpacity>
            )}
          </View>

          {bloquesSeleccionados.length > 0 && (
            <View style={styles.seleccionInfo}>
              <Text style={styles.seleccionText}>
                {bloquesSeleccionados.length} bloque{bloquesSeleccionados.length > 1 ? 's' : ''} seleccionado{bloquesSeleccionados.length > 1 ? 's' : ''}
                ({bloquesSeleccionados.length * 30} min)
              </Text>
            </View>
          )}

          {/* Leyenda de colores */}
          <View style={styles.leyendaContainer}>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaColor, { backgroundColor: colors.primary }]} />
              <Text style={styles.leyendaText}>Libre</Text>
            </View>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaColor, { backgroundColor: colors.reservaGarantizada }]} />
              <Text style={styles.leyendaText}>Garantizada</Text>
            </View>
            <View style={styles.leyendaItem}>
              <View style={[styles.leyendaColor, { backgroundColor: colors.reservaProvisional }]} />
              <Text style={styles.leyendaText}>Provisional</Text>
            </View>
          </View>

          {loadingHorarios ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : vistaActual === 'dia' ? (
            // Vista Día: Grid compacto de horarios
            <View style={styles.horariosGrid}>
              {horarios.map((horario, index) => {
                const estaSeleccionado = bloquesSeleccionados.some(b =>
                  b.fecha === fechaSeleccionada && b.horaInicio === horario.horaInicio
                );
                // Detectar si el horario ya terminó (usando hora de fin del bloque)
                const esPasado = bloqueTerminado(fechaSeleccionada, horario.horaFin);
                // Detectar si es de mi vivienda
                const esMiVivienda = horario.reservaExistente?.vivienda === user?.vivienda;
                // Determinar prioridad (garantizada si es primera O está protegida <24h)
                const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
                const esSegundaDesplazable = horario.prioridad === 'segunda' && !horario.estaProtegida;

                // Estilos según combinación vivienda + prioridad
                // Mi vivienda: verde sólido (primera) o dorado sólido (segunda)
                // Otra vivienda: gris + borde verde (primera) o gris + borde dorado (segunda, desplazable)
                const esMiGarantizada = !horario.disponible && esMiVivienda && esPrimeraOProtegida;
                const esMiProvisional = !horario.disponible && esMiVivienda && esSegundaDesplazable;
                const esOtraGarantizada = !horario.disponible && !esMiVivienda && esPrimeraOProtegida;
                const esOtraProvisional = !horario.disponible && !esMiVivienda && esSegundaDesplazable;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.horarioChip,
                      // Horario pasado - mostrar como desactivado
                      esPasado && styles.horarioChipPasado,
                      // Mi vivienda (solo si no es pasado)
                      !esPasado && esMiGarantizada && styles.horarioChipMiGarantizada,
                      !esPasado && esMiProvisional && styles.horarioChipMiProvisional,
                      // Otra vivienda (solo si no es pasado)
                      !esPasado && esOtraGarantizada && styles.horarioChipOtraGarantizada,
                      !esPasado && esOtraProvisional && styles.horarioChipOtraProvisional,
                      // Seleccionado
                      estaSeleccionado && styles.horarioChipSeleccionado,
                    ]}
                    onPress={() => {
                      if (esPasado) return; // No hacer nada si ya pasó
                      if (horario.disponible) {
                        toggleBloqueSeleccionado(horario);
                      } else if (esOtraProvisional) {
                        // Solo se puede desplazar provisionales de OTRA vivienda
                        handleSeleccionarDesplazable(horario);
                      }
                    }}
                    disabled={esPasado || (esOtraGarantizada || esMiVivienda) || reservando}
                  >
                    <Text
                      style={[
                        styles.horarioChipText,
                        esPasado && styles.horarioChipTextPasado,
                        !esPasado && (esMiGarantizada || esMiProvisional) && styles.horarioChipTextBlanco,
                        !esPasado && (esOtraGarantizada || esOtraProvisional) && styles.horarioChipTextOscuro,
                        estaSeleccionado && styles.horarioChipTextSeleccionado,
                      ]}
                    >
                      {horario.horaInicio}
                    </Text>
                    {!esPasado && esOtraProvisional && (
                      <View style={styles.iconoDesplazable}>
                        <Text style={styles.iconoDesplazableText}>!</Text>
                      </View>
                    )}
                    {estaSeleccionado && (
                      <View style={styles.checkMark}>
                        <Text style={styles.checkMarkText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            // Vista Semana: Grid de días y horarios
            Object.keys(horariosSemanales).length > 0 ? (
              Object.keys(horariosSemanales).map((fecha) => {
                const horariosDelDia = horariosSemanales[fecha];
                const disponiblesCount = horariosDelDia.filter(h => h.disponible || h.esDesplazable).length;

                return (
                  <View key={fecha} style={styles.diaCard}>
                    <View style={styles.diaHeader}>
                      <Text style={styles.diaFecha}>
                        {formatearFechaLegible(fecha)}
                      </Text>
                      <View style={styles.disponiblesBadge}>
                        <Text style={styles.disponiblesText}>
                          {disponiblesCount} disponibles
                        </Text>
                      </View>
                    </View>

                    <View style={styles.horariosGrid}>
                      {horariosDelDia.map((horario, index) => {
                        const estaSeleccionado = bloquesSeleccionados.some(b =>
                          b.fecha === fecha && b.horaInicio === horario.horaInicio
                        );
                        // Detectar si el horario ya terminó (usando hora de fin del bloque)
                        const esPasado = bloqueTerminado(fecha, horario.horaFin);
                        // Detectar si es de mi vivienda
                        const esMiVivienda = horario.reservaExistente?.vivienda === user?.vivienda;
                        // Determinar prioridad
                        const esPrimeraOProtegida = horario.prioridad === 'primera' || horario.estaProtegida;
                        const esSegundaDesplazable = horario.prioridad === 'segunda' && !horario.estaProtegida;

                        // Estilos según combinación vivienda + prioridad
                        const esMiGarantizada = !horario.disponible && esMiVivienda && esPrimeraOProtegida;
                        const esMiProvisional = !horario.disponible && esMiVivienda && esSegundaDesplazable;
                        const esOtraGarantizada = !horario.disponible && !esMiVivienda && esPrimeraOProtegida;
                        const esOtraProvisional = !horario.disponible && !esMiVivienda && esSegundaDesplazable;

                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.horarioChip,
                              // Horario pasado - mostrar como desactivado
                              esPasado && styles.horarioChipPasado,
                              // Mi vivienda (solo si no es pasado)
                              !esPasado && esMiGarantizada && styles.horarioChipMiGarantizada,
                              !esPasado && esMiProvisional && styles.horarioChipMiProvisional,
                              // Otra vivienda (solo si no es pasado)
                              !esPasado && esOtraGarantizada && styles.horarioChipOtraGarantizada,
                              !esPasado && esOtraProvisional && styles.horarioChipOtraProvisional,
                              estaSeleccionado && styles.horarioChipSeleccionado,
                            ]}
                            onPress={() => {
                              if (esPasado) return;
                              if (horario.disponible) {
                                toggleBloqueSeleccionado(horario, fecha);
                              } else if (esOtraProvisional) {
                                handleSeleccionarDesplazable(horario, fecha);
                              }
                            }}
                            disabled={esPasado || (esOtraGarantizada || esMiVivienda) || reservando}
                          >
                            <Text
                              style={[
                                styles.horarioChipText,
                                esPasado && styles.horarioChipTextPasado,
                                !esPasado && (esMiGarantizada || esMiProvisional) && styles.horarioChipTextBlanco,
                                !esPasado && (esOtraGarantizada || esOtraProvisional) && styles.horarioChipTextOscuro,
                                estaSeleccionado && styles.horarioChipTextSeleccionado,
                              ]}
                            >
                              {horario.horaInicio}
                            </Text>
                            {!esPasado && esOtraProvisional && (
                              <View style={styles.iconoDesplazable}>
                                <Text style={styles.iconoDesplazableText}>!</Text>
                              </View>
                            )}
                            {estaSeleccionado && (
                              <Text style={styles.horarioChipCheck}>✓</Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>
            )
          )}
        </View>
      )}

      </ScrollView>

      {/* Botón Reservar - Fijo en la parte inferior */}
      {bloquesSeleccionados.length > 0 && (
        <View style={styles.botonReservarContainerFijo}>
          <TouchableOpacity
            style={styles.botonReservar}
            onPress={confirmarReserva}
            disabled={reservando}
          >
            <Text style={styles.botonReservarText}>
              Reservar {bloquesSeleccionados.length} bloque{bloquesSeleccionados.length > 1 ? 's' : ''}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {reservando && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* CustomAlert component */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // Espacio para el botón fijo
  },
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  fechaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fechaButton: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  fechaButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  fechaInfo: {
    flex: 1,
    alignItems: 'center',
  },
  fechaText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  pistaCard: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pistaCardSelected: {
    borderColor: colors.primary,
  },
  pistaNombre: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  pistaDescripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  pistaFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Estilos para vista Día/Semana
  vistaSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  vistaBotón: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  vistaBotónActivo: {
    backgroundColor: colors.primary,
  },
  vistaBotónTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  vistaBotónTextoActivo: {
    color: '#fff',
  },
  // Estilos para vista semanal
  diaCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  diaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  diaFecha: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  disponiblesBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  disponiblesText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioChip: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  horarioChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  // Estilos para selección múltiple
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  limpiarButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  limpiarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  seleccionInfo: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  seleccionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  horarioChipSeleccionado: {
    backgroundColor: colors.accent,
  },
  horarioChipTextSeleccionado: {
    color: '#fff',
  },
  horarioChipCheck: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  botonReservarContainerFijo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  botonReservar: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonReservarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  checkMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: 'bold',
  },
  // Estilos para sistema de prioridades
  leyendaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  leyendaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  iconoDesplazable: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.reservaProvisional,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconoDesplazableText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Estilos para nuevo sistema de colores por vivienda + prioridad
  horarioChipMiGarantizada: {
    backgroundColor: colors.reservaGarantizada, // Verde sólido
  },
  horarioChipMiProvisional: {
    backgroundColor: colors.reservaProvisional, // Dorado sólido
  },
  horarioChipOtraGarantizada: {
    backgroundColor: colors.reservaDesplazable, // Gris
    borderWidth: 2,
    borderColor: colors.reservaGarantizada, // Borde verde
  },
  horarioChipOtraProvisional: {
    backgroundColor: colors.reservaDesplazable, // Gris
    borderWidth: 2,
    borderColor: colors.reservaProvisional, // Borde dorado
  },
  horarioChipTextBlanco: {
    color: '#fff',
  },
  horarioChipTextOscuro: {
    color: colors.text,
  },
  // Estilos para horarios pasados (desactivados)
  horarioChipPasado: {
    backgroundColor: colors.disabled,  // Gris
    opacity: 0.4,
  },
  horarioChipTextPasado: {
    color: colors.textSecondary,
  },
});
