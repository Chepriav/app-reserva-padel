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

const TYPES_ANNOUNCEMENT = [
  { value: 'info', label: 'Información', icon: 'information-circle', color: colors.announcementInfo },
  { value: 'aviso', label: 'Aviso', icon: 'warning', color: colors.announcementNotice },
  { value: 'urgente', label: 'Urgente', icon: 'alert-circle', color: colors.announcementUrgent },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: 'construct', color: colors.announcementMaintenance },
];

export function CreateAnnouncementModal({
  visible,
  onClose,
  onCreate,
  users,
  loadingUsers,
  creating,
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [recipients, setRecipients] = useState('todos');
  const [usersSelected, setUsersSelected] = useState([]);

  useEffect(() => {
    if (visible) {
      setTitle('');
      setMessage('');
      setType('info');
      setRecipients('todos');
      setUsersSelected([]);
    }
  }, [visible]);

  const handleCreate = () => {
    if (!title.trim() || !message.trim()) return;
    if (recipients === 'seleccionados' && usersSelected.length === 0) return;

    onCreate({
      title: title.trim(),
      message: message.trim(),
      type,
      recipients,
      usersIds: recipients === 'seleccionados' ? usersSelected : [],
    });
  };

  const isValid = title.trim().length > 0 &&
    message.trim().length > 0 &&
    (recipients === 'todos' || usersSelected.length > 0);

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
            <Text style={styles.headerTitle}>Nuevo message</Text>
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
              value={title}
              onChangeText={setTitle}
              editable={!creating}
            />

            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Escribe el mensaje..."
              placeholderTextColor={colors.disabled}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!creating}
            />

            <Text style={styles.label}>Type</Text>
            <View style={styles.typesContainer}>
              {TYPES_ANNOUNCEMENT.map(t => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeButton,
                    type === t.value && { backgroundColor: `${t.color}20`, borderColor: t.color },
                  ]}
                  onPress={() => setType(t.value)}
                  disabled={creating}
                >
                  <Ionicons
                    name={t.icon}
                    size={18}
                    color={type === t.value ? t.color : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      type === t.value && { color: t.color },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Recipients</Text>
            <View style={styles.recipientsOptions}>
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  recipients === 'todos' && styles.optionButtonSelected,
                ]}
                onPress={() => setRecipients('todos')}
                disabled={creating}
              >
                <View style={[styles.radio, recipients === 'todos' && styles.radioSelected]}>
                  {recipients === 'todos' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Todos los users</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionButton,
                  recipients === 'seleccionados' && styles.optionButtonSelected,
                ]}
                onPress={() => setRecipients('seleccionados')}
                disabled={creating}
              >
                <View style={[styles.radio, recipients === 'seleccionados' && styles.radioSelected]}>
                  {recipients === 'seleccionados' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.optionLabel}>Select users</Text>
              </TouchableOpacity>
            </View>

            {recipients === 'seleccionados' && (
              <View style={styles.selectorContainer}>
                <RecipientsSelector
                  users={users}
                  selected={usersSelected}
                  onSelectionChange={setUsersSelected}
                  loading={loadingUsers}
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
              onPress={handleCreate}
              disabled={!isValid || creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Enviar message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
