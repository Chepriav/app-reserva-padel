import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApartmentSelector } from '../ApartmentSelector';
import { SKILL_LEVELS, isApartmentValid, formatApartment } from '../../../constants/config';

export function ProfilePersonalInfo({
  user, editMode,
  name, setName,
  phone, setPhone,
  staircase, setStaircase,
  floor, setFloor,
  door, setDoor,
  skillLevel, setSkillLevel,
  showLevelPicker, setShowLevelPicker,
  cancelingRequest,
  onCancelRequest,
  onRequestChange,
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información Personal</Text>
      <View style={styles.infoCard}>
        {/* Nombre */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre</Text>
          {editMode ? (
            <TextInput style={styles.infoInput} value={name} onChangeText={setName} autoCapitalize="words" />
          ) : (
            <Text style={styles.infoValue}>{user?.name}</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Teléfono */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono</Text>
          {editMode ? (
            <TextInput style={styles.infoInput} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.infoValue}>{user?.phone}</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Vivienda */}
        <View style={styles.infoRowVertical}>
          <View style={styles.apartmentLabelRow}>
            <Text style={styles.infoLabel}>Vivienda</Text>
            {!user?.isAdmin && <Text style={styles.apartmentLocked}>🔒</Text>}
          </View>
          {editMode && user?.isAdmin ? (
            <View style={styles.apartmentSelectorContainer}>
              <ApartmentSelector
                staircase={staircase} floor={floor} door={door}
                onChangeStaircase={setStaircase} onChangeFloor={setFloor} onChangeDoor={setDoor}
              />
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {isApartmentValid(user?.apartment) ? formatApartment(user?.apartment) : user?.apartment}
            </Text>
          )}

          {/* Solicitud pendiente */}
          {!user?.isAdmin && user?.requestedApartment && (
            <View style={styles.requestPending}>
              <View style={styles.requestInfo}>
                <Text style={styles.requestBadge}>Cambio pendiente</Text>
                <Text style={styles.requestText}>
                  Solicitud: {isApartmentValid(user.requestedApartment)
                    ? formatApartment(user.requestedApartment)
                    : user.requestedApartment}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelRequestButton, cancelingRequest && styles.buttonDisabled]}
                onPress={onCancelRequest}
                disabled={cancelingRequest}
              >
                {cancelingRequest ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={styles.cancelRequestText}>Cancelar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Botón solicitar cambio */}
          {!user?.isAdmin && !user?.requestedApartment && !editMode && (
            <TouchableOpacity style={styles.requestChangeButton} onPress={onRequestChange}>
              <Text style={styles.requestChangeText}>Solicitar cambio de vivienda</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.separator} />

        {/* Nivel de Juego */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nivel de juego</Text>
          {editMode ? (
            <TouchableOpacity style={styles.levelSelector} onPress={() => setShowLevelPicker(!showLevelPicker)}>
              <Text style={styles.levelSelectorText}>
                {skillLevel ? SKILL_LEVELS.find((n) => n.value === skillLevel)?.label : 'Seleccionar'}
              </Text>
              <Text style={styles.levelSelectorArrow}>▼</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoValue}>
              {skillLevel ? SKILL_LEVELS.find((n) => n.value === skillLevel)?.label : 'No especificado'}
            </Text>
          )}
        </View>

        {editMode && showLevelPicker && (
          <View style={styles.levelPickerContainer}>
            {SKILL_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                style={[styles.levelOption, skillLevel === level.value && styles.levelOptionSelected]}
                onPress={() => { setSkillLevel(level.value); setShowLevelPicker(false); }}
              >
                <Text style={[styles.levelOptionText, skillLevel === level.value && styles.levelOptionTextSelected]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {user?.isAdmin && (
          <>
            <View style={styles.separator} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Rol</Text>
              <View style={styles.adminBadge}>
                <Text style={styles.adminText}>Administrador</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 12 },
  infoCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoRowVertical: { paddingVertical: 12 },
  infoLabel: { fontSize: 16, color: colors.textSecondary },
  infoValue: { fontSize: 16, fontWeight: '600', color: colors.text },
  separator: { height: 1, backgroundColor: colors.border },
  infoInput: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6,
    padding: 8, fontSize: 16, color: colors.text, backgroundColor: colors.background, textAlign: 'right',
  },
  apartmentLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  apartmentLocked: { fontSize: 14 },
  apartmentSelectorContainer: { marginTop: 8 },
  requestPending: {
    marginTop: 12, backgroundColor: colors.accent + '15', borderRadius: 8,
    padding: 12, borderWidth: 1, borderColor: colors.accent + '40',
  },
  requestInfo: { marginBottom: 8 },
  requestBadge: { fontSize: 12, fontWeight: '600', color: colors.accent, marginBottom: 4 },
  requestText: { fontSize: 14, color: colors.text },
  cancelRequestButton: {
    backgroundColor: colors.surface, borderRadius: 6,
    paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.error, minHeight: 36, justifyContent: 'center',
  },
  cancelRequestText: { color: colors.error, fontSize: 13, fontWeight: '500' },
  buttonDisabled: { backgroundColor: colors.disabled },
  requestChangeButton: {
    marginTop: 12, backgroundColor: colors.primary + '10', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.primary,
  },
  requestChangeText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  levelSelector: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: 6, padding: 8, backgroundColor: colors.background,
  },
  levelSelectorText: { flex: 1, fontSize: 16, color: colors.text, textAlign: 'right', marginRight: 8 },
  levelSelectorArrow: { fontSize: 12, color: colors.textSecondary },
  levelPickerContainer: {
    marginTop: 8, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: 8, overflow: 'hidden',
  },
  levelOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  levelOptionSelected: { backgroundColor: colors.primary },
  levelOptionText: { fontSize: 16, color: colors.text },
  levelOptionTextSelected: { color: '#fff', fontWeight: '600' },
  adminBadge: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  adminText: { fontSize: 14, color: '#fff', fontWeight: '500' },
});
