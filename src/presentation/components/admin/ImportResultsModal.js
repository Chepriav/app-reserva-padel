import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { csvImportService } from '../../../services/csvImportService';
import { styles } from './ImportResultsModalStyles';

/**
 * Modal to display import results summary
 * Shows success count, error details, and export options
 */
export function ImportResultsModal({ visible, results, onClose }) {
  if (!results) return null;

  const { success = [], errors = [] } = results;
  const totalProcessed = success.length + errors.length;

  // Export error log as CSV
  const handleExportErrors = () => {
    if (errors.length === 0) return;

    const errorRows = errors.map((item, index) => ({
      line: index + 2, // Start from line 2 (after header)
      row: item.user,
      errors: [item.error],
    }));

    const csv = csvImportService.exportErrorLog(errorRows);

    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'errores-importacion.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Resultado de Importación</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Summary */}
            <View style={styles.summaryContainer}>
              {success.length > 0 && (
                <View style={styles.summaryBox}>
                  <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                  <Text style={styles.summaryNumber}>{success.length}</Text>
                  <Text style={styles.summaryLabel}>
                    {success.length === 1 ? 'Usuario creado' : 'Usuarios creados'}
                  </Text>
                </View>
              )}

              {errors.length > 0 && (
                <View style={[styles.summaryBox, styles.summaryBoxError]}>
                  <Ionicons name="warning" size={48} color={colors.error} />
                  <Text style={styles.summaryNumber}>{errors.length}</Text>
                  <Text style={styles.summaryLabel}>
                    {errors.length === 1 ? 'Error' : 'Errores'}
                  </Text>
                </View>
              )}
            </View>

            {/* Success message */}
            {success.length > 0 && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={20} color={colors.primary} />
                <Text style={styles.infoText}>
                  Los usuarios recibirán un email para establecer su contraseña.
                </Text>
              </View>
            )}

            {/* Error details */}
            {errors.length > 0 && (
              <View style={styles.errorSection}>
                <Text style={styles.errorSectionTitle}>Detalles de errores:</Text>

                <View style={styles.errorList}>
                  {errors.map((item, index) => (
                    <View key={index} style={styles.errorItem}>
                      <View style={styles.errorItemHeader}>
                        <Ionicons name="alert-circle" size={16} color={colors.error} />
                        <Text style={styles.errorItemEmail}>{item.user.email}</Text>
                      </View>
                      <Text style={styles.errorItemMessage}>
                        {item.user.nombre} - {item.error}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Export button */}
                <TouchableOpacity
                  style={styles.exportButton}
                  onPress={handleExportErrors}
                >
                  <Ionicons name="download-outline" size={18} color={colors.primary} />
                  <Text style={styles.exportButtonText}>Exportar log de errores (CSV)</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* No results message */}
            {totalProcessed === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="information-circle-outline" size={48} color={colors.disabled} />
                <Text style={styles.emptyText}>No se procesaron usuarios</Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
