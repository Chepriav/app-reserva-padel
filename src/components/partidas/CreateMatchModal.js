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
import PlayersEditor from './PlayersEditor';
import {
  ModeSelector,
  TypeSelector,
  ReservationSelector,
  LevelSelector,
  ParticipantsSelector,
  LevelsMultiSelector,
  PriceInput,
} from './form';

/**
 * Modal to create or edit a match or class
 * If editMode=true, shows "Edit" instead of "Search"
 */
export default function CreateMatchModal({
  visible,
  modalState,
  setModalState,
  // Support both English and Spanish prop names
  players,
  jugadores = players,
  user,
  usuario = user,
  futureReservations,
  reservasFuturas = futureReservations,
  onOpenPlayerModal,
  onAbrirModalJugador = onOpenPlayerModal,
  onRemovePlayer,
  onRemoveJugador = onRemovePlayer,
  onCreate,
  onCrear = onCreate,
  onClose,
  onCerrar = onClose,
  editMode = false,
  modoEditar = editMode,
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

  const getTitle = () => {
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
        <View style={[styles.content, esClase && styles.contentClass]}>
          <Text style={styles.title}>{getTitle()}</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <ModeSelector
              isClass={esClase}
              onChange={(newMode) => updateState({
                esClase: newMode,
                nivelPreferido: null,
                niveles: [],
                minParticipantes: 2,
                maxParticipantes: newMode ? 8 : 4,
              })}
            />

            <TypeSelector
              type={tipo}
              isClass={esClase}
              onChange={(newType) => updateState({
                tipo: newType,
                reservaSeleccionada: newType === 'abierta' ? null : reservaSeleccionada,
              })}
            />

            {tipo === 'con_reserva' && (
              <ReservationSelector
                reservations={reservasFuturas}
                selected={reservaSeleccionada}
                onSelect={(reservation) => updateState({ reservaSeleccionada: reservation })}
              />
            )}

            {esClase && (
              <>
                <ParticipantsSelector
                  minParticipants={minParticipantes}
                  maxParticipants={maxParticipantes}
                  onChangeMin={(val) => updateState({ minParticipantes: val })}
                  onChangeMax={(val) => updateState({ maxParticipantes: val })}
                />
                <LevelsMultiSelector
                  levels={niveles}
                  onChange={(newLevels) => updateState({ niveles: newLevels })}
                />
                <PriceInput
                  pricePerStudent={precioAlumno}
                  pricePerGroup={precioGrupo}
                  onChange={(prices) => updateState(prices)}
                />
              </>
            )}

            {!esClase && (
              <LevelSelector
                level={nivelPreferido}
                onChange={(level) => updateState({ nivelPreferido: level })}
              />
            )}

            <PlayersEditor
              players={jugadores}
              user={usuario}
              onAddPlayer={onAbrirModalJugador}
              onRemovePlayer={onRemoveJugador}
              isClass={esClase}
              maxParticipants={esClase ? maxParticipantes : 4}
            />

            <Text style={styles.label}>Mensaje (opcional)</Text>
            <TextInput
              style={styles.messageInput}
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

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCerrar}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, saving && styles.buttonDisabled]}
              onPress={onCrear}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Publicar</Text>
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
  contentClass: {
    borderWidth: 2,
    borderColor: colors.classColor,
  },
  title: {
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
  messageInput: {
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
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

// Legacy alias
export { CreateMatchModal as CrearPartidaModal };
