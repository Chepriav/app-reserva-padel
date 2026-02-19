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
      <Text style={styles.sectionTitle}>Horario de Apertura y Cierre</Text>
      <Text style={styles.sectionDescription}>
        Configura los horarios en que las pistas están disponibles para reserva
      </Text>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setConfig({
          ...config,
          usarHorariosDiferenciados: !config.usarHorariosDiferenciados
        })}
      >
        <View style={[styles.checkbox, config.usarHorariosDiferenciados && styles.checkboxChecked]}>
          {config.usarHorariosDiferenciados && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          Usar horarios diferentes para semana y fin de semana
        </Text>
      </TouchableOpacity>

      {config.usarHorariosDiferenciados ? (
        <>
          <Text style={styles.subsectionTitle}>Lunes a Viernes</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apertura</Text>
              <TextInput
                style={styles.input}
                value={config.semanaHoraApertura}
                onChangeText={(text) => setConfig({ ...config, semanaHoraApertura: text })}
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
                value={config.semanaHoraCierre}
                onChangeText={(text) => setConfig({ ...config, semanaHoraCierre: text })}
                placeholder="22:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>Sábado y Domingo</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apertura</Text>
              <TextInput
                style={styles.input}
                value={config.findeHoraApertura}
                onChangeText={(text) => setConfig({ ...config, findeHoraApertura: text })}
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
                value={config.findeHoraCierre}
                onChangeText={(text) => setConfig({ ...config, findeHoraCierre: text })}
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
              <Text style={styles.label}>Hora de Apertura</Text>
              <TextInput
                style={styles.input}
                value={config.horaApertura}
                onChangeText={(text) => setConfig({ ...config, horaApertura: text })}
                placeholder="08:00"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM (ej: 08:00)</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hora de Cierre</Text>
              <TextInput
                style={styles.input}
                value={config.horaCierre}
                onChangeText={(text) => setConfig({ ...config, horaCierre: text })}
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
          <Text style={styles.subsectionTitle}>Pausa de Lunes a Viernes</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inicio</Text>
              <TextInput
                style={styles.input}
                value={config.pausaInicio || ''}
                onChangeText={(text) => setConfig({ ...config, pausaInicio: text })}
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
                value={config.pausaFin || ''}
                onChangeText={(text) => setConfig({ ...config, pausaFin: text })}
                placeholder="16:30"
                placeholderTextColor={colors.textSecondary}
                maxLength={5}
              />
              <Text style={styles.helperText}>Formato: HH:MM</Text>
            </View>
          </View>
        </>
      )}

      {config.usarHorariosDiferenciados && (
        <>
          <View style={styles.separator} />

          <Text style={styles.sectionTitle}>Pausa de Fin de Semana</Text>
          <Text style={styles.sectionDescription}>
            Define un horario de pausa específico para sábados y domingos
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
                    value={config.findePausaInicio || ''}
                    onChangeText={(text) => setConfig({ ...config, findePausaInicio: text })}
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
                    value={config.findePausaFin || ''}
                    onChangeText={(text) => setConfig({ ...config, findePausaFin: text })}
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
          <Text style={styles.saveButtonText}>Guardar Configuración</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>ℹ️ Información</Text>
        <Text style={styles.infoText}>
          • Los bloques de la pausa no aparecerán en el calendario
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
