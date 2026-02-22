import React from 'react';
import { View, Text, Modal, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApartmentSelector } from '../ApartmentSelector';

export function ApartmentChangeModal({ requestModal, setRequestModal, onClose, onSubmit }) {
  return (
    <Modal visible={requestModal.visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Solicitar cambio de vivienda</Text>
          <Text style={styles.subtitle}>
            Selecciona tu nueva vivienda. Un administrador revisará tu solicitud.
          </Text>

          <View style={styles.selectorContainer}>
            <ApartmentSelector
              staircase={requestModal.staircase}
              floor={requestModal.floor}
              door={requestModal.door}
              onChangeStaircase={(v) => setRequestModal((prev) => ({ ...prev, staircase: v }))}
              onChangeFloor={(v) => setRequestModal((prev) => ({ ...prev, floor: v }))}
              onChangeDoor={(v) => setRequestModal((prev) => ({ ...prev, door: v }))}
            />
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={requestModal.saving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, requestModal.saving && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={requestModal.saving}
            >
              {requestModal.saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Enviar solicitud</Text>
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
