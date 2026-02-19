import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { RecipientsSelector } from './RecipientsSelector';
import { styles } from './CreateAnnouncementModalStyles';

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
                <RecipientsSelector
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
// Re-export with English name
export { CrearAnuncioModal as CreateAnnouncementModal };
