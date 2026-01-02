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
import JugadoresEditor from './JugadoresEditor';
import {
  ModalidadSelector,
  TipoSelector,
  ReservaSelector,
  NivelSelector,
  ParticipantesSelector,
  NivelesMultiSelector,
  PrecioInput,
} from './form';

/**
 * Modal para crear o editar una partida o clase
 * Si modoEditar=true, muestra "Editar" en vez de "Buscar"
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
  const {
    tipo,
    reservaSeleccionada,
    mensaje,
    nivelPreferido,
    saving,
    esClase,
    niveles,
    minParticipantes,
    maxParticipantes,
    precioAlumno,
    precioGrupo,
  } = modalState;

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  const getTitulo = () => {
    if (modoEditar) {
      return esClase ? 'Editar clase' : 'Editar partida';
    }
    return esClase ? 'Organizar clase' : 'Buscar jugadores';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCerrar}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, esClase && styles.contentClase]}>
          <Text style={styles.titulo}>{getTitulo()}</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <ModalidadSelector
              esClase={esClase}
              onChange={(nuevaModalidad) => updateState({
                esClase: nuevaModalidad,
                nivelPreferido: null,
                niveles: [],
                minParticipantes: 2,
                maxParticipantes: nuevaModalidad ? 8 : 4,
              })}
            />

            <TipoSelector
              tipo={tipo}
              esClase={esClase}
              onChange={(nuevoTipo) => updateState({
                tipo: nuevoTipo,
                reservaSeleccionada: nuevoTipo === 'abierta' ? null : reservaSeleccionada,
              })}
            />

            {tipo === 'con_reserva' && (
              <ReservaSelector
                reservas={reservasFuturas}
                seleccionada={reservaSeleccionada}
                onSelect={(reserva) => updateState({ reservaSeleccionada: reserva })}
              />
            )}

            {esClase && (
              <>
                <ParticipantesSelector
                  minParticipantes={minParticipantes}
                  maxParticipantes={maxParticipantes}
                  onChangeMin={(val) => updateState({ minParticipantes: val })}
                  onChangeMax={(val) => updateState({ maxParticipantes: val })}
                />
                <NivelesMultiSelector
                  niveles={niveles}
                  onChange={(nuevosNiveles) => updateState({ niveles: nuevosNiveles })}
                />
                <PrecioInput
                  precioAlumno={precioAlumno}
                  precioGrupo={precioGrupo}
                  onChange={(precios) => updateState(precios)}
                />
              </>
            )}

            {!esClase && (
              <NivelSelector
                nivel={nivelPreferido}
                onChange={(nivel) => updateState({ nivelPreferido: nivel })}
              />
            )}

            <JugadoresEditor
              jugadores={jugadores}
              usuario={usuario}
              onAddJugador={onAbrirModalJugador}
              onRemoveJugador={onRemoveJugador}
              esClase={esClase}
              maxParticipantes={esClase ? maxParticipantes : 4}
            />

            <Text style={styles.label}>Mensaje (opcional)</Text>
            <TextInput
              style={styles.mensajeInput}
              placeholder={esClase
                ? 'Ej: Clase para mejorar el revés...'
                : 'Ej: Buscamos pareja para partido amistoso...'
              }
              placeholderTextColor={colors.textSecondary}
              value={mensaje}
              onChangeText={(text) => updateState({ mensaje: text })}
              multiline
              maxLength={200}
            />
          </ScrollView>

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
  contentClase: {
    borderWidth: 2,
    borderColor: colors.clase,
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
