import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { csvImportService } from '../../services/csvImportService';

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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 600,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: colors.successLight || '#e8f5e9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryBoxError: {
    backgroundColor: colors.errorLight || '#ffebee',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  errorSection: {
    marginBottom: 16,
  },
  errorSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  errorList: {
    gap: 12,
    marginBottom: 16,
  },
  errorItem: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  errorItemEmail: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  errorItemMessage: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 22,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
