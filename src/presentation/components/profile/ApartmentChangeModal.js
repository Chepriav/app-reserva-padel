import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApartmentSelector } from '../ApartmentSelector';

export function ApartmentChangeModal({ solicitudModal, setSolicitudModal, onClose, onSubmit }) {
  return (
    <Modal visible={solicitudModal.visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Solicitar Cambio de Vivienda</Text>
          <Text style={styles.subtitle}>
            Selecciona tu nueva vivienda. Un administrador revisará tu solicitud.
          </Text>

          <View style={styles.selectorContainer}>
            <ApartmentSelector
              escalera={solicitudModal.escalera}
              piso={solicitudModal.piso}
              puerta={solicitudModal.puerta}
              onChangeEscalera={(v) => setSolicitudModal((prev) => ({ ...prev, escalera: v }))}
              onChangePiso={(v) => setSolicitudModal((prev) => ({ ...prev, piso: v }))}
              onChangePuerta={(v) => setSolicitudModal((prev) => ({ ...prev, puerta: v }))}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={solicitudModal.saving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, solicitudModal.saving && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={solicitudModal.saving}
            >
              {solicitudModal.saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enviar Solicitud</Text>
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
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  content: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 24, width: '100%', maxWidth: 400,
  },
  title: { fontSize: 20, fontWeight: '600', color: colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 20, textAlign: 'center' },
  selectorContainer: { marginBottom: 24 },
  buttons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1, backgroundColor: colors.surface, borderRadius: 8,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  cancelButtonText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  saveButton: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  buttonDisabled: { opacity: 0.6 },
});
