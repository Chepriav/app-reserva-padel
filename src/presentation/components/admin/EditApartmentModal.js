import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../../constants/colors';
import { ApartmentSelector } from '../ApartmentSelector';

/**
 * Modal para editar vivienda de un usuario
 */
export function EditViviendaModal({
  visible,
  usuario,
  escalera,
  piso,
  puerta,
  saving,
  onChangeEscalera,
  onChangePiso,
  onChangePuerta,
  onSave,
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Cambiar Vivienda</Text>
          {usuario && (
            <Text style={styles.subtitle}>Usuario: {usuario.nombre}</Text>
          )}

          <View style={styles.selectorContainer}>
            <ApartmentSelector
              escalera={escalera}
              piso={piso}
              puerta={puerta}
              onChangeEscalera={onChangeEscalera}
              onChangePiso={onChangePiso}
              onChangePuerta={onChangePuerta}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={onSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  selectorContainer: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
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
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

// Export with English name for consistency
export { EditViviendaModal as EditApartmentModal };
