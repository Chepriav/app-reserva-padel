import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../../../constants/colors';
import { useAlert } from '../../hooks/useAlert';
import { CustomAlert } from '../CustomAlert';
import { useScheduleConfig } from '../../hooks/useScheduleConfig';
import { styles } from './ScheduleConfigSectionStyles';

/**
 * Section for configuring schedule settings (opening/closing times, lunch break)
 */
export function ScheduleConfigSection({ userId }) {
  const { alertConfig, showAlert, closeAlert } = useAlert();
  const {
    loading,
    saving,
    config,
    setConfig,
    breakEnabled,
    setBreakEnabled,
    weekendBreakEnabled,
    setWeekendBreakEnabled,
    handleSave,
  } = useScheduleConfig(userId, showAlert);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Horario de apertura y cierre</Text>
      <Text style={styles.sectionDescription}>
        Configura los horarios en que las pistas están disponibles para reservar
      </Text>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setConfig({
          ...config,
          useDifferentiatedSchedules: !config.useDifferentiatedSchedules
        })}
      >
        <View style={[styles.checkbox, config.useDifferentiatedSchedules && styles.checkboxChecked]}>
          {config.useDifferentiatedSchedules && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          Usar horarios diferentes entre semana y fin de semana
        </Text>
      </TouchableOpacity>

      {config.useDifferentiatedSchedules ? (
        <>
          <Text style={styles.subsectionTitle}>Lunes a viernes</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apertura</Text>
              <TextInput
                style={styles.input}
                value={config.weekdayOpeningTime}
                onChangeText={(text) => setConfig({ ...config, weekdayOpeningTime: text })}
                placeholder="08:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cierre</Text>
              <TextInput
                style={styles.input}
                value={config.weekdayClosingTime}
                onChangeText={(text) => setConfig({ ...config, weekdayClosingTime: text })}
                placeholder="22:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Sábado y domingo</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apertura</Text>
              <TextInput
                style={styles.input}
                value={config.weekendOpeningTime}
                onChangeText={(text) => setConfig({ ...config, weekendOpeningTime: text })}
                placeholder="09:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cierre</Text>
              <TextInput
                style={styles.input}
                value={config.weekendClosingTime}
                onChangeText={(text) => setConfig({ ...config, weekendClosingTime: text })}
                placeholder="23:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora de apertura</Text>
              <TextInput
                style={styles.input}
                value={config.openingTime}
                onChangeText={(text) => setConfig({ ...config, openingTime: text })}
                placeholder="08:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM (ej: 08:00)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora de cierre</Text>
              <TextInput
                style={styles.input}
                value={config.closingTime}
                onChangeText={(text) => setConfig({ ...config, closingTime: text })}
                placeholder="22:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM (ej: 22:00)</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>Pausa</Text>
      <Text style={styles.sectionDescription}>
        Define un horario no reservable (ej: 14:00 - 16:30)
      </Text>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setBreakEnabled(!breakEnabled)}
      >
        <View style={[styles.checkbox, breakEnabled && styles.checkboxChecked]}>
          {breakEnabled && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Habilitar pausa</Text>
      </TouchableOpacity>

      {breakEnabled && (
        <>
          <Text style={styles.subsectionTitle}>Pausa de lunes a viernes</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inicio</Text>
              <TextInput
                style={styles.input}
                value={config.breakStart || ''}
                onChangeText={(text) => setConfig({ ...config, breakStart: text })}
                placeholder="14:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fin</Text>
              <TextInput
                style={styles.input}
                value={config.breakEnd || ''}
                onChangeText={(text) => setConfig({ ...config, breakEnd: text })}
                placeholder="16:30"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>
          </View>
        </>
      )}

      {config.useDifferentiatedSchedules && (
        <>
          <View style={styles.separator} />

          <Text style={styles.sectionTitle}>Pausa de fin de semana</Text>
          <Text style={styles.sectionDescription}>
            Define una pausa específica para sábados y domingos
          </Text>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setWeekendBreakEnabled(!weekendBreakEnabled)}
          >
            <View style={[styles.checkbox, weekendBreakEnabled && styles.checkboxChecked]}>
              {weekendBreakEnabled && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkboxLabel}>Habilitar pausa de fin de semana</Text>
          </TouchableOpacity>

          {weekendBreakEnabled && (
            <>
              <View style={styles.row}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Inicio</Text>
                  <TextInput
                    style={styles.input}
                    value={config.weekendBreakStart || ''}
                    onChangeText={(text) => setConfig({ ...config, weekendBreakStart: text })}
                    placeholder="14:00"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={5}
                  />
                  <Text style={styles.helperText}>Formato: HH:MM</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Fin</Text>
                  <TextInput
                    style={styles.input}
                    value={config.weekendBreakEnd || ''}
                    onChangeText={(text) => setConfig({ ...config, weekendBreakEnd: text })}
                    placeholder="16:30"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={5}
                  />
                  <Text style={styles.helperText}>Formato: HH:MM</Text>
                </View>
              </View>
            </>
          )}
        </>
      )}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Guardar configuración</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los horarios de la pausa no aparecerán en el calendario
        </Text>
        <Text style={styles.infoText}>
          • La pausa aplicará todos los días de la semana
        </Text>
        <Text style={styles.infoText}>
          • Las reservas existentes no se modificarán
        </Text>
      </View>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={closeAlert}
      />
    </View>
  );
}
