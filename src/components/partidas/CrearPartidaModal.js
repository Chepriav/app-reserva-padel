import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { NIVELES_JUEGO } from '../../constants/config';
import { formatearFechaLegible } from '../../utils/dateHelpers';
import JugadoresEditor from './JugadoresEditor';

/**
 * Modal para crear o editar una partida
 * Si modoEditar=true, muestra "Editar partida" en vez de "Buscar jugadores"
 */
export default function CrearPartidaModal({
  visible,
  modalState,
  setModalState,
  jugadores,
  usuario,
  reservasFuturas,
  onAbrirModalJugador,
  onRemoveJugador,
  onCrear,
  onCerrar,
  modoEditar = false,
}) {
  const { tipo, reservaSeleccionada, mensaje, nivelPreferido, saving } = modalState;

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.titulo}>{modoEditar ? 'Editar partida' : 'Buscar jugadores'}</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {/* Tipo de partida */}
            <TipoSelector
              tipo={tipo}
              onChange={(nuevoTipo) => updateState({
                tipo: nuevoTipo,
                reservaSeleccionada: nuevoTipo === 'abierta' ? null : reservaSeleccionada,
              })}
            />

            {/* Selector de reserva */}
            {tipo === 'con_reserva' && (
              <ReservaSelector
                reservas={reservasFuturas}
                seleccionada={reservaSeleccionada}
                onSelect={(reserva) => updateState({ reservaSeleccionada: reserva })}
              />
            )}

            {/* Nivel preferido */}
            <NivelSelector
              nivel={nivelPreferido}
              onChange={(nivel) => updateState({ nivelPreferido: nivel })}
            />

            {/* Jugadores */}
            <JugadoresEditor
              jugadores={jugadores}
              usuario={usuario}
              onAddJugador={onAbrirModalJugador}
              onRemoveJugador={onRemoveJugador}
            />

            {/* Mensaje */}
            <Text style={styles.label}>Mensaje (opcional)</Text>
            <TextInput
              style={styles.mensajeInput}
              placeholder="Ej: Buscamos pareja para partido amistoso..."
              placeholderTextColor={colors.textSecondary}
              value={mensaje}
              onChangeText={(text) => updateState({ mensaje: text })}
              multiline
              maxLength={200}
            />
          </ScrollView>

          {/* Botones */}
          <View style={styles.botones}>
            <TouchableOpacity
              style={styles.botonCancelar}
              onPress={onCerrar}
              disabled={saving}
            >
              <Text style={styles.botonCancelarText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.botonCrear, saving && styles.botonDisabled]}
              onPress={onCrear}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.botonCrearText}>Publicar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TipoSelector({ tipo, onChange }) {
  return (
    <>
      <Text style={styles.label}>Tipo de partida</Text>
      <View style={styles.tipoButtons}>
        <TouchableOpacity
          style={[styles.tipoButton, tipo === 'abierta' && styles.tipoButtonActivo]}
          onPress={() => onChange('abierta')}
        >
          <Text style={[styles.tipoButtonText, tipo === 'abierta' && styles.tipoButtonTextActivo]}>
            Fecha abierta
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tipoButton, tipo === 'con_reserva' && styles.tipoButtonActivo]}
          onPress={() => onChange('con_reserva')}
        >
          <Text style={[styles.tipoButtonText, tipo === 'con_reserva' && styles.tipoButtonTextActivo]}>
            Con reserva
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function ReservaSelector({ reservas, seleccionada, onSelect }) {
  return (
    <View style={styles.reservasContainer}>
      <Text style={styles.label}>Selecciona tu reserva</Text>
      {reservas.length === 0 ? (
        <Text style={styles.noReservas}>No tienes reservas futuras disponibles</Text>
      ) : (
        reservas.map((reserva) => (
          <TouchableOpacity
            key={reserva.id}
            style={[
              styles.reservaOption,
              seleccionada?.id === reserva.id && styles.reservaOptionSelected,
            ]}
            onPress={() => onSelect(reserva)}
          >
            <Text style={styles.reservaOptionText}>
              {formatearFechaLegible(reserva.fecha)} • {reserva.horaInicio?.slice(0, 5)}
            </Text>
            <Text style={styles.reservaOptionPista}>{reserva.pistaNombre}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

function NivelSelector({ nivel, onChange }) {
  return (
    <>
      <Text style={styles.label}>Nivel preferido (opcional)</Text>
      <View style={styles.nivelesContainer}>
        <TouchableOpacity
          style={[styles.nivelOption, !nivel && styles.nivelOptionSelected]}
          onPress={() => onChange(null)}
        >
          <Text style={[styles.nivelOptionText, !nivel && styles.nivelOptionTextSelected]}>
            Cualquiera
          </Text>
        </TouchableOpacity>
        {NIVELES_JUEGO.map((n) => (
          <TouchableOpacity
            key={n.value}
            style={[styles.nivelOption, nivel === n.value && styles.nivelOptionSelected]}
            onPress={() => onChange(n.value)}
          >
            <Text style={[styles.nivelOptionText, nivel === n.value && styles.nivelOptionTextSelected]}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  titulo: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 0,
    maxHeight: '70%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    marginTop: 12,
  },
  tipoButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tipoButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tipoButtonActivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tipoButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  tipoButtonTextActivo: {
    color: '#fff',
    fontWeight: '600',
  },
  reservasContainer: {
    marginTop: 8,
  },
  noReservas: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  reservaOption: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reservaOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  reservaOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  reservaOptionPista: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  nivelesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nivelOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nivelOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nivelOptionText: {
    fontSize: 13,
    color: colors.text,
  },
  nivelOptionTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  mensajeInput: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  botones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  botonCancelar: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonCancelarText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  botonCrear: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  botonCrearText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  botonDisabled: {
    opacity: 0.6,
  },
});
