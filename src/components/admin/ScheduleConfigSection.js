import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors } from '../../constants/colors';
import { scheduleConfigService } from '../../services/scheduleConfigService';
import { useAlert } from '../../hooks/useAlert';
import { CustomAlert } from '../CustomAlert';
import { BreakTimesConfig } from './BreakTimesConfig';

/**
 * Section for configuring schedule settings (opening/closing times, lunch break)
 */
export function ScheduleConfigSection({ userId }) {
  const { alertConfig, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    horaApertura: '08:00',
    horaCierre: '22:00',
    duracionBloque: 30,
    pausaInicio: '',
    pausaFin: '',
    motivoPausa: 'Hora de comida',
    pausaDiasSemana: null, // null = todos los días
    usarHorariosDiferenciados: false,
    semanaHoraApertura: '08:00',
    semanaHoraCierre: '22:00',
    findeHoraApertura: '09:00',
    findeHoraCierre: '23:00',
    findePausaInicio: '',
    findePausaFin: '',
    findeMotivoPausa: 'Hora de comida',
    findePausaDiasSemana: null,
  });

  const [breakEnabled, setBreakEnabled] = useState(false);
  const [weekendBreakEnabled, setWeekendBreakEnabled] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const result = await scheduleConfigService.getConfig();
    if (result.success) {
      // Strip seconds from times (HH:MM:SS -> HH:MM)
      const cleanConfig = {
        ...result.data,
        horaApertura: result.data.horaApertura?.slice(0, 5) || '08:00',
        horaCierre: result.data.horaCierre?.slice(0, 5) || '22:00',
        pausaInicio: result.data.pausaInicio?.slice(0, 5) || '',
        pausaFin: result.data.pausaFin?.slice(0, 5) || '',
        usarHorariosDiferenciados: result.data.usarHorariosDiferenciados || false,
        semanaHoraApertura: result.data.semanaHoraApertura?.slice(0, 5) || '08:00',
        semanaHoraCierre: result.data.semanaHoraCierre?.slice(0, 5) || '22:00',
        findeHoraApertura: result.data.findeHoraApertura?.slice(0, 5) || '09:00',
        findeHoraCierre: result.data.findeHoraCierre?.slice(0, 5) || '23:00',
        findePausaInicio: result.data.findePausaInicio?.slice(0, 5) || '',
        findePausaFin: result.data.findePausaFin?.slice(0, 5) || '',
        findeMotivoPausa: result.data.findeMotivoPausa || 'Hora de comida',
        findePausaDiasSemana: result.data.findePausaDiasSemana || null,
      };
      setConfig(cleanConfig);
      setBreakEnabled(!!result.data.pausaInicio && !!result.data.pausaFin);
      setWeekendBreakEnabled(!!result.data.findePausaInicio && !!result.data.findePausaFin);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    // Validations
    if (config.usarHorariosDiferenciados) {
      if (!config.semanaHoraApertura || !config.semanaHoraCierre) {
        showAlert('Error', 'Debes especificar horarios de lunes a viernes');
        return;
      }
      if (!config.findeHoraApertura || !config.findeHoraCierre) {
        showAlert('Error', 'Debes especificar horarios de fin de semana');
        return;
      }
    } else {
      if (!config.horaApertura || !config.horaCierre) {
        showAlert('Error', 'Debes especificar hora de apertura y cierre');
        return;
      }
    }

    if (breakEnabled && (!config.pausaInicio || !config.pausaFin)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa');
      return;
    }

    if (weekendBreakEnabled && config.usarHorariosDiferenciados && (!config.findePausaInicio || !config.findePausaFin)) {
      showAlert('Error', 'Debes especificar hora de inicio y fin de la pausa de fin de semana');
      return;
    }

    // If break is disabled, clear values
    const configToSave = {
      ...config,
      pausaInicio: breakEnabled ? config.pausaInicio : null,
      pausaFin: breakEnabled ? config.pausaFin : null,
      motivoPausa: breakEnabled ? config.motivoPausa : null,
      pausaDiasSemana: breakEnabled ? config.pausaDiasSemana : null,
      findePausaInicio: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaInicio : null,
      findePausaFin: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaFin : null,
      findeMotivoPausa: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findeMotivoPausa : null,
      findePausaDiasSemana: (weekendBreakEnabled && config.usarHorariosDiferenciados) ? config.findePausaDiasSemana : null,
    };

    setSaving(true);

    try {
      const result = await scheduleConfigService.updateConfig(userId, configToSave);
      setSaving(false);

      if (result.success) {
        showAlert('Éxito', 'Configuración guardada correctamente');
        await loadConfig(); // Reload to see changes
      } else {
        showAlert('Error', result.error || 'Error al guardar configuración');
      }
    } catch (error) {
      setSaving(false);
      showAlert('Error', 'Error inesperado al guardar: ' + error.message);
    }
  };

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 0,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  saveButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    marginBottom: 32,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 18,
  },
});
