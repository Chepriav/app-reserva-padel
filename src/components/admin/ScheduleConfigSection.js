import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { colors } from '../../constants/colors';
import { scheduleConfigService } from '../../services/scheduleConfigService';

/**
 * Section for configuring schedule settings (opening/closing times, lunch break)
 */
export function ScheduleConfigSection({ userId }) {
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
  });

  const [pausaEnabled, setPausaEnabled] = useState(false);

  const diasSemana = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Lun' },
    { value: 2, label: 'Mar' },
    { value: 3, label: 'Mié' },
    { value: 4, label: 'Jue' },
    { value: 5, label: 'Vie' },
    { value: 6, label: 'Sáb' },
  ];

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    const result = await scheduleConfigService.getConfig();
    if (result.success) {
      setConfig(result.data);
      setPausaEnabled(!!result.data.pausaInicio && !!result.data.pausaFin);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    console.log('[ScheduleConfig] handleSave ejecutado');
    console.log('[ScheduleConfig] userId:', userId);
    console.log('[ScheduleConfig] config actual:', config);

    // Validaciones
    if (!config.horaApertura || !config.horaCierre) {
      Alert.alert('Error', 'Debes especificar hora de apertura y cierre');
      return;
    }

    if (pausaEnabled && (!config.pausaInicio || !config.pausaFin)) {
      Alert.alert('Error', 'Debes especificar hora de inicio y fin de la pausa');
      return;
    }

    // Si la pausa está deshabilitada, limpiar los valores
    const configToSave = {
      ...config,
      pausaInicio: pausaEnabled ? config.pausaInicio : null,
      pausaFin: pausaEnabled ? config.pausaFin : null,
      motivoPausa: pausaEnabled ? config.motivoPausa : null,
      pausaDiasSemana: pausaEnabled ? config.pausaDiasSemana : null,
    };

    console.log('[ScheduleConfig] Guardando configuración:', configToSave);
    setSaving(true);

    try {
      const result = await scheduleConfigService.updateConfig(userId, configToSave);
      console.log('[ScheduleConfig] Resultado:', result);

      setSaving(false);

      if (result.success) {
        Alert.alert('Éxito', 'Configuración guardada correctamente');
        await loadConfig(); // Recargar para ver cambios
      } else {
        console.error('[ScheduleConfig] Error al guardar:', result.error);
        Alert.alert('Error', result.error || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('[ScheduleConfig] Excepción al guardar:', error);
      setSaving(false);
      Alert.alert('Error', 'Error inesperado al guardar: ' + error.message);
    }
  };

  const toggleDiaSemana = (dia) => {
    const current = config.pausaDiasSemana || [];
    const newDias = current.includes(dia)
      ? current.filter(d => d !== dia)
      : [...current, dia];

    setConfig({
      ...config,
      pausaDiasSemana: newDias.length === 0 ? null : newDias,
    });
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

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora de Apertura</Text>
          <TextInput
            style={styles.input}
            value={config.horaApertura}
            onChangeText={(text) => setConfig({ ...config, horaApertura: text })}
            placeholder="08:00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hora de Cierre</Text>
          <TextInput
            style={styles.input}
            value={config.horaCierre}
            onChangeText={(text) => setConfig({ ...config, horaCierre: text })}
            placeholder="22:00"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Duración del Bloque (minutos)</Text>
        <TextInput
          style={styles.input}
          value={String(config.duracionBloque)}
          onChangeText={(text) => setConfig({ ...config, duracionBloque: parseInt(text) || 30 })}
          placeholder="30"
          keyboardType="numeric"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.separator} />

      <Text style={styles.sectionTitle}>Pausa (Hora de Comida)</Text>
      <Text style={styles.sectionDescription}>
        Define un horario no reservable (ejemplo: hora de comida de 14:00 a 16:30)
      </Text>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setPausaEnabled(!pausaEnabled)}
      >
        <View style={[styles.checkbox, pausaEnabled && styles.checkboxChecked]}>
          {pausaEnabled && <Text style={styles.checkboxIcon}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>Habilitar pausa</Text>
      </TouchableOpacity>

      {pausaEnabled && (
        <>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Inicio de Pausa</Text>
              <TextInput
                style={styles.input}
                value={config.pausaInicio || ''}
                onChangeText={(text) => setConfig({ ...config, pausaInicio: text })}
                placeholder="14:00"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fin de Pausa</Text>
              <TextInput
                style={styles.input}
                value={config.pausaFin || ''}
                onChangeText={(text) => setConfig({ ...config, pausaFin: text })}
                placeholder="16:30"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Motivo</Text>
            <TextInput
              style={styles.input}
              value={config.motivoPausa || ''}
              onChangeText={(text) => setConfig({ ...config, motivoPausa: text })}
              placeholder="Hora de comida"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Días de la semana (deja vacío para todos los días)</Text>
            <View style={styles.diasContainer}>
              {diasSemana.map((dia) => (
                <TouchableOpacity
                  key={dia.value}
                  style={[
                    styles.diaButton,
                    config.pausaDiasSemana?.includes(dia.value) && styles.diaButtonActive,
                  ]}
                  onPress={() => toggleDiaSemana(dia.value)}
                >
                  <Text
                    style={[
                      styles.diaButtonText,
                      config.pausaDiasSemana?.includes(dia.value) && styles.diaButtonTextActive,
                    ]}
                  >
                    {dia.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!config.pausaDiasSemana || config.pausaDiasSemana.length === 0 ? (
              <Text style={styles.helperText}>La pausa aplicará todos los días</Text>
            ) : (
              <Text style={styles.helperText}>
                La pausa aplicará solo los días seleccionados
              </Text>
            )}
          </View>
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
          • Los bloques que caen dentro de la pausa no se mostrarán en el calendario de reservas
        </Text>
        <Text style={styles.infoText}>
          • Los cambios aplicarán inmediatamente para todas las nuevas reservas
        </Text>
        <Text style={styles.infoText}>
          • Las reservas existentes no se verán afectadas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
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
    marginTop: 16,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  row: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
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
    marginVertical: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  diasContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  diaButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  diaButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  diaButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  diaButtonTextActive: {
    color: '#fff',
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
