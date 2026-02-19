import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../../../constants/colors';
import { ApartmentSelector } from '../ApartmentSelector';
import { NIVELES_JUEGO, esViviendaValida, formatearVivienda } from '../../../constants/config';

export function ProfilePersonalInfo({
  user, editMode,
  nombre, setNombre,
  telefono, setTelefono,
  escalera, setEscalera,
  piso, setPiso,
  puerta, setPuerta,
  nivelJuego, setNivelJuego,
  showNivelPicker, setShowNivelPicker,
  cancelingSolicitud,
  onCancelarSolicitud,
  onSolicitarCambio,
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Información Personal</Text>
      <View style={styles.infoCard}>
        {/* Nombre */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nombre</Text>
          {editMode ? (
            <TextInput style={styles.infoInput} value={nombre} onChangeText={setNombre} autoCapitalize="words" />
          ) : (
            <Text style={styles.infoValue}>{user?.nombre}</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Teléfono */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Teléfono</Text>
          {editMode ? (
            <TextInput style={styles.infoInput} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
          ) : (
            <Text style={styles.infoValue}>{user?.telefono}</Text>
          )}
        </View>

        <View style={styles.separator} />

        {/* Vivienda */}
        <View style={styles.infoRowVertical}>
          <View style={styles.viviendaLabelRow}>
            <Text style={styles.infoLabel}>Vivienda</Text>
            {!user?.esAdmin && <Text style={styles.viviendaLocked}>🔒</Text>}
          </View>
          {editMode && user?.esAdmin ? (
            <View style={styles.viviendaSelectorContainer}>
              <ApartmentSelector
                escalera={escalera} piso={piso} puerta={puerta}
                onChangeEscalera={setEscalera} onChangePiso={setPiso} onChangePuerta={setPuerta}
              />
            </View>
          ) : (
            <Text style={styles.infoValue}>
              {esViviendaValida(user?.vivienda) ? formatearVivienda(user?.vivienda) : user?.vivienda}
            </Text>
          )}

          {/* Solicitud pendiente */}
          {!user?.esAdmin && user?.viviendaSolicitada && (
            <View style={styles.solicitudPendiente}>
              <View style={styles.solicitudInfo}>
                <Text style={styles.solicitudBadge}>Cambio pendiente</Text>
                <Text style={styles.solicitudText}>
                  Solicitud: {esViviendaValida(user.viviendaSolicitada)
                    ? formatearVivienda(user.viviendaSolicitada)
                    : user.viviendaSolicitada}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.cancelarSolicitudButton, cancelingSolicitud && styles.buttonDisabled]}
                onPress={onCancelarSolicitud}
                disabled={cancelingSolicitud}
              >
                {cancelingSolicitud ? (
                  <ActivityIndicator size="small" color={colors.error} />
                ) : (
                  <Text style={styles.cancelarSolicitudText}>Cancelar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Botón solicitar cambio */}
          {!user?.esAdmin && !user?.viviendaSolicitada && !editMode && (
            <TouchableOpacity style={styles.solicitarCambioButton} onPress={onSolicitarCambio}>
              <Text style={styles.solicitarCambioText}>Solicitar cambio de vivienda</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.separator} />

        {/* Nivel de Juego */}
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nivel de Juego</Text>
          {editMode ? (
            <TouchableOpacity style={styles.nivelSelector} onPress={() => setShowNivelPicker(!showNivelPicker)}>
              <Text style={styles.nivelSelectorText}>
                {nivelJuego ? NIVELES_JUEGO.find((n) => n.value === nivelJuego)?.label : 'Seleccionar'}
              </Text>
              <Text style={styles.nivelSelectorArrow}>▼</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.infoValue}>
              {nivelJuego ? NIVELES_JUEGO.find((n) => n.value === nivelJuego)?.label : 'No especificado'}
            </Text>
          )}
        </View>

        {editMode && showNivelPicker && (
          <View style={styles.nivelPickerContainer}>
            {NIVELES_JUEGO.map((nivel) => (
              <TouchableOpacity
                key={nivel.value}
                style={[styles.nivelOption, nivelJuego === nivel.value && styles.nivelOptionSelected]}
                onPress={() => { setNivelJuego(nivel.value); setShowNivelPicker(false); }}
              >
                <Text style={[styles.nivelOptionText, nivelJuego === nivel.value && styles.nivelOptionTextSelected]}>
                  {nivel.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {user?.esAdmin && (
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
  viviendaLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  viviendaLocked: { fontSize: 14 },
  viviendaSelectorContainer: { marginTop: 8 },
  solicitudPendiente: {
    marginTop: 12, backgroundColor: colors.accent + '15', borderRadius: 8,
    padding: 12, borderWidth: 1, borderColor: colors.accent + '40',
  },
  solicitudInfo: { marginBottom: 8 },
  solicitudBadge: { fontSize: 12, fontWeight: '600', color: colors.accent, marginBottom: 4 },
  solicitudText: { fontSize: 14, color: colors.text },
  cancelarSolicitudButton: {
    backgroundColor: colors.surface, borderRadius: 6,
    paddingVertical: 8, paddingHorizontal: 12, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.error, minHeight: 36, justifyContent: 'center',
  },
  cancelarSolicitudText: { color: colors.error, fontSize: 13, fontWeight: '500' },
  buttonDisabled: { backgroundColor: colors.disabled },
  solicitarCambioButton: {
    marginTop: 12, backgroundColor: colors.primary + '10', borderRadius: 8,
    paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start',
    borderWidth: 1, borderColor: colors.primary,
  },
  solicitarCambioText: { color: colors.primary, fontSize: 14, fontWeight: '500' },
  nivelSelector: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: colors.border, borderRadius: 6, padding: 8, backgroundColor: colors.background,
  },
  nivelSelectorText: { flex: 1, fontSize: 16, color: colors.text, textAlign: 'right', marginRight: 8 },
  nivelSelectorArrow: { fontSize: 12, color: colors.textSecondary },
  nivelPickerContainer: {
    marginTop: 8, backgroundColor: colors.surface, borderWidth: 1,
    borderColor: colors.border, borderRadius: 8, overflow: 'hidden',
  },
  nivelOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  nivelOptionSelected: { backgroundColor: colors.primary },
  nivelOptionText: { fontSize: 16, color: colors.text },
  nivelOptionTextSelected: { color: '#fff', fontWeight: '600' },
  adminBadge: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  adminText: { fontSize: 14, color: '#fff', fontWeight: '500' },
});
