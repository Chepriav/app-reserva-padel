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
import { colors } from '../../../constants/colors';
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
  players,
  user,
  futureReservations,
  onOpenPlayerModal,
  onRemovePlayer,
  onCreate,
  onClose,
  editMode = false,
}) {
  const {
    type,
    selectedReservation,
    message,
    preferredLevel,
    saving,
    isClass,
    levels,
    minParticipants,
    maxParticipants,
    pricePerStudent,
    pricePerGroup,
  } = modalState;

  const updateState = (updates) => {
    setModalState(prev => ({ ...prev, ...updates }));
  };

  const getTitle = () => {
    if (editMode) {
      return isClass ? 'Editar clase' : 'Editar partida';
    }
    return isClass ? 'Organizar clase' : 'Buscar jugadores';
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.content, isClass && styles.contentClass]}>
          <Text style={styles.title}>{getTitle()}</Text>

          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            <ModeSelector
              isClass={isClass}
              onChange={(newMode) => updateState({
                isClass: newMode,
                preferredLevel: null,
                levels: [],
                minParticipants: 2,
                maxParticipants: newMode ? 8 : 4,
              })}
            />

            <TypeSelector
              type={type}
              isClass={isClass}
              onChange={(newType) => updateState({
                type: newType,
                selectedReservation: newType === 'abierta' ? null : selectedReservation,
              })}
            />

            {type === 'con_reserva' && (
              <ReservationSelector
                reservations={futureReservations}
                selected={selectedReservation}
                onSelect={(reservation) => updateState({ selectedReservation: reservation })}
              />
            )}

            {isClass && (
              <>
                <ParticipantsSelector
                  minParticipants={minParticipants}
                  maxParticipants={maxParticipants}
                  onChangeMin={(val) => updateState({ minParticipants: val })}
                  onChangeMax={(val) => updateState({ maxParticipants: val })}
                />
                <LevelsMultiSelector
                  levels={levels}
                  onChange={(newLevels) => updateState({ levels: newLevels })}
                />
                <PriceInput
                  pricePerStudent={pricePerStudent}
                  pricePerGroup={pricePerGroup}
                  onChange={(prices) => updateState(prices)}
                />
              </>
            )}

            {!isClass && (
              <LevelSelector
                level={preferredLevel}
                onChange={(level) => updateState({ preferredLevel: level })}
              />
            )}

            <PlayersEditor
              players={players}
              user={user}
              onAddPlayer={onOpenPlayerModal}
              onRemovePlayer={onRemovePlayer}
              isClass={isClass}
              maxParticipants={isClass ? maxParticipants : 4}
            />

            <Text style={styles.label}>Mensaje (opcional)</Text>
            <TextInput
              style={styles.messageInput}
              placeholder={isClass
                ? 'Ej: Clase para mejorar el revés...'
                : 'Ej: Buscamos pareja para partido amistoso...'
              }
              placeholderTextColor={colors.textSecondary}
              value={message}
              onChangeText={(text) => updateState({ message: text })}
              multiline
              maxLength={200}
            />
          </ScrollView>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cerrar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createButton, saving && styles.buttonDisabled]}
              onPress={onCreate}
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
