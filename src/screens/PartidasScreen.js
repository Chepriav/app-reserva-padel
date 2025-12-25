import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useReservas } from '../context/ReservasContext';
import { colors } from '../constants/colors';
import { CustomAlert } from '../components/CustomAlert';
import {
  PartidaCard,
  CrearPartidaModal,
  AddJugadorModal,
} from '../components/partidas';
import {
  usePartidas,
  usePartidasActions,
  useCrearPartidaModal,
  useAddJugadorModal,
  useUsuariosUrbanizacion,
} from '../hooks';

export default function PartidasScreen() {
  const { user } = useAuth();
  const { reservas } = useReservas();
  const [tabActivo, setTabActivo] = useState('disponibles');
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  // Hooks para partidas
  const { partidas, loading, refreshing, cargarPartidas, onRefresh } = usePartidas(
    user?.id,
    tabActivo
  );

  const actions = usePartidasActions(user?.id, cargarPartidas);

  // Modal crear partida
  const crearModal = useCrearPartidaModal(user?.id);

  // Modal añadir jugador
  const addJugadorModal = useAddJugadorModal((jugador) => {
    const yaExiste = crearModal.jugadores.some(
      j => j.tipo === 'urbanizacion' && j.usuario?.id === jugador.usuario?.id
    );
    if (yaExiste) {
      showAlert('Ya añadido', 'Este jugador ya está en la partida');
      return false;
    }
    return crearModal.addJugador(jugador);
  });

  // Usuarios de la urbanización
  const usuariosUrb = useUsuariosUrbanizacion(user?.id);

  // Helper para mostrar alertas
  const showAlert = (title, message, buttons = [{ text: 'OK', onPress: () => {} }]) => {
    setAlertConfig({ visible: true, title, message, buttons });
  };

  // Obtener reservas futuras (excluyendo las que ya tienen partida)
  const getReservasFuturas = () => {
    if (!reservas) return [];
    const ahora = new Date();
    return reservas.filter((r) => {
      const fechaReserva = new Date(r.fecha + 'T' + r.horaInicio);
      const yaConPartida = crearModal.reservasConPartida.includes(r.id);
      return r.estado === 'confirmada' && fechaReserva > ahora && !yaConPartida;
    });
  };

  // Handlers de acciones
  const handleCancelar = (partida) => {
    showAlert('Cancelar partida', '¿Seguro que quieres cancelar esta partida?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.cancelarPartida(partida.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleSolicitarUnirse = (partida) => {
    showAlert(
      'Solicitar unirse',
      `¿Quieres enviar una solicitud para unirte a la partida de ${partida.creadorNombre}?`,
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => {} },
        {
          text: 'Enviar solicitud',
          onPress: async () => {
            const result = await actions.solicitarUnirse(partida.id, user);
            if (result.success) {
              showAlert('Solicitud enviada', 'Tu solicitud ha sido enviada. El creador debe aceptarla.');
            } else {
              showAlert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const handleCancelarSolicitud = (partida) => {
    showAlert('Cancelar solicitud', '¿Seguro que quieres cancelar tu solicitud?', [
      { text: 'No', style: 'cancel', onPress: () => {} },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.cancelarSolicitud(partida.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleDesapuntarse = (partida) => {
    showAlert('Desapuntarse', '¿Seguro que quieres desapuntarte de esta partida?', [
      { text: 'Cancelar', style: 'cancel', onPress: () => {} },
      {
        text: 'Desapuntarme',
        style: 'destructive',
        onPress: async () => {
          const result = await actions.desapuntarse(partida.id);
          if (!result.success) {
            showAlert('Error', result.error);
          }
        },
      },
    ]);
  };

  const handleAceptarSolicitud = async (jugadorId, partida) => {
    const result = await actions.aceptarSolicitud(jugadorId, partida.id);
    if (result.success) {
      showAlert('Solicitud aceptada', 'El jugador ha sido añadido a la partida');
    } else {
      showAlert('Error', result.error);
    }
  };

  const handleRechazarSolicitud = async (jugadorId, partida) => {
    await actions.rechazarSolicitud(jugadorId, partida.id);
  };

  // Crear partida
  const handleCrearPartida = async () => {
    const { tipo, reservaSeleccionada, mensaje, nivelPreferido } = crearModal.modalState;

    if (tipo === 'con_reserva' && !reservaSeleccionada) {
      showAlert('Error', 'Selecciona una reserva para vincular la partida');
      return;
    }

    crearModal.setSaving(true);

    const partidaData = {
      creadorId: user.id,
      creadorNombre: user.nombre,
      creadorVivienda: user.vivienda,
      tipo,
      mensaje: mensaje.trim() || null,
      nivelPreferido,
      jugadoresIniciales: crearModal.jugadores,
    };

    if (tipo === 'con_reserva' && reservaSeleccionada) {
      partidaData.reservaId = reservaSeleccionada.id;
      partidaData.fecha = reservaSeleccionada.fecha;
      partidaData.horaInicio = reservaSeleccionada.horaInicio;
      partidaData.horaFin = reservaSeleccionada.horaFin;
      partidaData.pistaNombre = reservaSeleccionada.pistaNombre;
    }

    const result = await actions.crearPartida(partidaData);

    crearModal.setSaving(false);

    if (result.success) {
      crearModal.cerrar();
      const total = 1 + crearModal.jugadores.length;
      const mensajeExito = total >= 4
        ? 'Partida creada con 4 jugadores. ¡A jugar!'
        : 'Tu solicitud de partida ha sido publicada.';
      showAlert(total >= 4 ? 'Partida completa' : 'Partida creada', mensajeExito);
    } else {
      showAlert('Error', result.error);
    }
  };

  // Abrir modal añadir jugador
  const handleAbrirAddJugador = () => {
    usuariosUrb.cargar();
    addJugadorModal.abrir();
  };

  // Añadir jugador de urbanización
  const handleAddUrbanizacion = (usuario) => {
    if (!addJugadorModal.addUrbanizacion(usuario)) {
      showAlert('Partida completa', 'Ya tienes 3 jugadores añadidos (4 con el creador)');
    }
  };

  // Añadir jugador externo
  const handleAddExterno = () => {
    const result = addJugadorModal.addExterno();
    if (!result.success) {
      showAlert('Error', result.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'disponibles' && styles.tabActivo]}
          onPress={() => setTabActivo('disponibles')}
        >
          <Text style={[styles.tabText, tabActivo === 'disponibles' && styles.tabTextActivo]}>
            Buscan jugadores
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tabActivo === 'mis_partidas' && styles.tabActivo]}
          onPress={() => setTabActivo('mis_partidas')}
        >
          <Text style={[styles.tabText, tabActivo === 'mis_partidas' && styles.tabTextActivo]}>
            Mis partidas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de partidas */}
      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : partidas.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {tabActivo === 'disponibles'
                ? 'No hay partidas buscando jugadores'
                : 'No tienes partidas activas'}
            </Text>
          </View>
        ) : (
          partidas.map((partida) => (
            <PartidaCard
              key={partida.id}
              partida={partida}
              usuarioActualId={user.id}
              onCancelar={handleCancelar}
              onSolicitarUnirse={handleSolicitarUnirse}
              onCancelarSolicitud={handleCancelarSolicitud}
              onDesapuntarse={handleDesapuntarse}
              onAceptarSolicitud={handleAceptarSolicitud}
              onRechazarSolicitud={handleRechazarSolicitud}
            />
          ))
        )}
      </ScrollView>

      {/* Botón crear partida */}
      <TouchableOpacity style={styles.botonCrear} onPress={crearModal.abrir}>
        <Text style={styles.botonCrearText}>+ Buscar jugadores</Text>
      </TouchableOpacity>

      {/* Modal crear partida */}
      <CrearPartidaModal
        visible={crearModal.visible}
        modalState={crearModal.modalState}
        setModalState={crearModal.setModalState}
        jugadores={crearModal.jugadores}
        usuario={user}
        reservasFuturas={getReservasFuturas()}
        onAbrirModalJugador={handleAbrirAddJugador}
        onRemoveJugador={crearModal.removeJugador}
        onCrear={handleCrearPartida}
        onCerrar={crearModal.cerrar}
      />

      {/* Modal añadir jugador */}
      <AddJugadorModal
        visible={addJugadorModal.visible}
        modalState={addJugadorModal.modalState}
        setModalState={addJugadorModal.setModalState}
        usuarios={usuariosUrb.usuarios}
        loadingUsuarios={usuariosUrb.loading}
        jugadoresActuales={crearModal.jugadores}
        onAddUrbanizacion={handleAddUrbanizacion}
        onAddExterno={handleAddExterno}
        onCerrar={addJugadorModal.cerrar}
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActivo: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  tabTextActivo: {
    color: colors.primary,
    fontWeight: '600',
  },
  lista: {
    flex: 1,
  },
  listaContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
  botonCrear: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 20 : 30,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  botonCrearText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
