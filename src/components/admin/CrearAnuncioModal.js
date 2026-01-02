import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { SelectorDestinatarios } from './SelectorDestinatarios';

const TIPOS_ANUNCIO = [
  { value: 'info', label: 'Información', icon: 'information-circle', color: colors.anuncioInfo },
  { value: 'aviso', label: 'Aviso', icon: 'warning', color: colors.anuncioAviso },
  { value: 'urgente', label: 'Urgente', icon: 'alert-circle', color: colors.anuncioUrgente },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: 'construct', color: colors.anuncioMantenimiento },
];

export function CrearAnuncioModal({
  visible,
  onClose,
  onCrear,
  usuarios,
  loadingUsuarios,
  creating,
}) {
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [tipo, setTipo] = useState('info');
  const [destinatarios, setDestinatarios] = useState('todos');
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);

  useEffect(() => {
    if (visible) {
      setTitulo('');
      setMensaje('');
      setTipo('info');
      setDestinatarios('todos');
      setUsuariosSeleccionados([]);
    }
  }, [visible]);

  const handleCrear = () => {
    if (!titulo.trim() || !mensaje.trim()) return;
    if (destinatarios === 'seleccionados' && usuariosSeleccionados.length === 0) return;

    onCrear({
      titulo: titulo.trim(),
      mensaje: mensaje.trim(),
      tipo,
      destinatarios,
      usuariosIds: destinatarios === 'seleccionados' ? usuariosSeleccionados : [],
    });
  };

  const isValid = titulo.trim().length > 0 &&
    mensaje.trim().length > 0 &&
    (destinatarios === 'todos' || usuariosSeleccionados.length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nuevo mensaje</Text>
            <TouchableOpacity onPress={onClose} disabled={creating}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Título</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe el título..."
              placeholderTextColor={colors.disabled}
              value={titulo}
              onChangeText={setTitulo}
              editable={!creating}
            />

            <Text style={styles.label}>Mensaje</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribe el mensaje..."
              placeholderTextColor={colors.disabled}
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!creating}
            />

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.tiposContainer}>
              {TIPOS_ANUNCIO.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.tipoButton,
                    tipo === t.value && { backgroundColor: `${t.color}20`, borderColor: t.color },
                  ]}
                  onPress={() => setTipo(t.value)}
                  disabled={creating}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={tipo === t.value ? t.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tipoLabel,
                      tipo === t.value && { color: t.color },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Destinatarios</Text>
            <View style={styles.destinatariosOptions}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  destinatarios === 'todos' && styles.optionButtonSelected,
                ]}
                onPress={() => setDestinatarios('todos')}
                disabled={creating}
              >
                <View style={[styles.radio, destinatarios === 'todos' && styles.radioSelected]}>
                  {destinatarios === 'todos' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Todos los usuarios</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  destinatarios === 'seleccionados' && styles.optionButtonSelected,
                ]}
                onPress={() => setDestinatarios('seleccionados')}
                disabled={creating}
              >
                <View style={[styles.radio, destinatarios === 'seleccionados' && styles.radioSelected]}>
                  {destinatarios === 'seleccionados' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Seleccionar usuarios</Text>
              </TouchableOpacity>
            </View>

            {destinatarios === 'seleccionados' && (
              <View style={styles.selectorContainer}>
                <SelectorDestinatarios
                  usuarios={usuarios}
                  seleccionados={usuariosSeleccionados}
                  onSeleccionChange={setUsuariosSeleccionados}
                  loading={loadingUsuarios}
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={creating}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleCrear}
              disabled={!isValid || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar mensaje</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  tiposContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  tipoLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  destinatariosOptions: {
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  optionButtonSelected: {},
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    fontSize: 15,
    color: colors.text,
  },
  selectorContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
