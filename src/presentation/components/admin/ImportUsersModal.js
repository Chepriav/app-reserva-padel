import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { csvImportService } from '../../services/csvImportService';

/**
 * Modal for importing users from CSV file
 * Three phases: select → validate → importing
 */
export function ImportUsersModal({ visible, onClose, onComplete, onImport }) {
  const [phase, setPhase] = useState('select'); // 'select' | 'validate' | 'importing'
  const [file, setFile] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentUser, setCurrentUser] = useState(null);
  const [results, setResults] = useState({ success: [], errors: [] });

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setPhase('select');
        setFile(null);
        setValidationResult(null);
        setImporting(false);
        setProgress({ current: 0, total: 0 });
        setCurrentUser(null);
        setResults({ success: [], errors: [] });
      }, 300);
    }
  }, [visible]);

  // Handle file selection (web only for now)
  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPhase('validating');

    // Parse and validate CSV
    const result = await csvImportService.parseCSV(selectedFile);

    if (!result.success) {
      // File-level errors
      setValidationResult({
        valid: false,
        fileErrors: result.errors,
        validRows: [],
        rowErrors: [],
      });
      setPhase('validate');
      return;
    }

    // Show validation results
    setValidationResult({
      valid: result.data.length > 0,
      fileErrors: [],
      validRows: result.data,
      rowErrors: result.errors || [],
    });
    setPhase('validate');
  };

  // Start import process
  const handleStartImport = async () => {
    if (!validationResult?.validRows || validationResult.validRows.length === 0) {
      return;
    }

    setPhase('importing');
    setImporting(true);
    setProgress({ current: 0, total: validationResult.validRows.length });

    const successList = [];
    const errorList = [];

    // Call parent's import function
    await onImport(
      validationResult.validRows,
      (current, total, user) => {
        setProgress({ current, total });
        setCurrentUser(user);
      },
      (user, success, error) => {
        if (success) {
          successList.push(user);
        } else {
          errorList.push({ user, error });
        }
        setResults({ success: successList, errors: errorList });
      }
    );

    setImporting(false);
    setCurrentUser(null);

    // Call onComplete with results
    onComplete({ success: successList, errors: errorList });
  };

  // Cancel and close
  const handleCancel = () => {
    if (!importing) {
      onClose();
    }
  };

  // Try again
  const handleTryAgain = () => {
    setPhase('select');
    setFile(null);
    setValidationResult(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Importar Usuarios desde CSV</Text>
            {!importing && (
              <TouchableOpacity onPress={handleCancel}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Phase: Select */}
            {phase === 'select' && (
              <View style={styles.phaseContainer}>
                <Ionicons name="cloud-upload-outline" size={64} color={colors.primary} />
                <Text style={styles.phaseTitle}>Selecciona un archivo CSV</Text>
                <Text style={styles.phaseDescription}>
                  El archivo debe contener las columnas: nombre, codigo, email
                </Text>

                {/* File input (web only) */}
                {Platform.OS === 'web' && (
                  <View style={styles.fileInputContainer}>
                    <input
                      type="file"
                      accept=".csv,text/csv,application/vnd.ms-excel"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                      id="csv-file-input"
                    />
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => document.getElementById('csv-file-input').click()}
                    >
                      <Ionicons name="folder-open-outline" size={20} color="#fff" />
                      <Text style={styles.selectButtonText}>Seleccionar Archivo</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Example format */}
                <View style={styles.exampleBox}>
                  <Text style={styles.exampleTitle}>Formato esperado:</Text>
                  <View style={styles.exampleCode}>
                    <Text style={styles.exampleCodeText}>nombre,codigo,email</Text>
                    <Text style={styles.exampleCodeText}>Juan Pérez,1-3-B,juan@example.com</Text>
                    <Text style={styles.exampleCodeText}>María López,2-4-C,maria@example.com</Text>
                  </View>
                </View>

                {/* Download example */}
                <TouchableOpacity
                  style={styles.downloadLink}
                  onPress={() => {
                    const csv = csvImportService.generateExampleCSV();
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ejemplo-usuarios.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Ionicons name="download-outline" size={16} color={colors.primary} />
                  <Text style={styles.downloadLinkText}>Descargar archivo de ejemplo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Phase: Validating */}
            {phase === 'validating' && (
              <View style={styles.phaseContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.phaseTitle}>Validando archivo...</Text>
              </View>
            )}

            {/* Phase: Validate Results */}
            {phase === 'validate' && validationResult && (
              <View style={styles.phaseContainer}>
                {validationResult.fileErrors.length > 0 ? (
                  // File-level errors
                  <>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={styles.phaseTitle}>Error en el archivo</Text>
                    {validationResult.fileErrors.map((error, index) => (
                      <Text key={index} style={styles.errorText}>
                        • {error}
                      </Text>
                    ))}
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAgain}>
                      <Text style={styles.secondaryButtonText}>Intentar de nuevo</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  // Validation summary
                  <>
                    <Text style={styles.phaseTitle}>Validación completada</Text>

                    {/* Valid users count */}
                    {validationResult.validRows.length > 0 && (
                      <View style={styles.summaryBox}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={styles.summaryText}>
                          {validationResult.validRows.length} usuarios válidos
                        </Text>
                      </View>
                    )}

                    {/* Errors count */}
                    {validationResult.rowErrors.length > 0 && (
                      <View style={[styles.summaryBox, styles.summaryBoxError]}>
                        <Ionicons name="warning" size={24} color={colors.warning} />
                        <Text style={styles.summaryText}>
                          {validationResult.rowErrors.length} errores encontrados
                        </Text>
                      </View>
                    )}

                    {/* Error details */}
                    {validationResult.rowErrors.length > 0 && (
                      <View style={styles.errorDetailsBox}>
                        <Text style={styles.errorDetailsTitle}>Detalles de errores:</Text>
                        <ScrollView style={styles.errorList}>
                          {validationResult.rowErrors.slice(0, 10).map((error, index) => (
                            <View key={index} style={styles.errorItem}>
                              {error.errors.map((msg, idx) => (
                                <Text key={idx} style={styles.errorItemText}>
                                  • {msg}
                                </Text>
                              ))}
                            </View>
                          ))}
                          {validationResult.rowErrors.length > 10 && (
                            <Text style={styles.errorMore}>
                              ... y {validationResult.rowErrors.length - 10} más
                            </Text>
                          )}
                        </ScrollView>
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.buttonRow}>
                      <TouchableOpacity style={styles.secondaryButton} onPress={handleTryAgain}>
                        <Text style={styles.secondaryButtonText}>Cancelar</Text>
                      </TouchableOpacity>

                      {validationResult.validRows.length > 0 && (
                        <TouchableOpacity style={styles.primaryButton} onPress={handleStartImport}>
                          <Text style={styles.primaryButtonText}>
                            Importar {validationResult.validRows.length} usuarios
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Phase: Importing */}
            {phase === 'importing' && (
              <View style={styles.phaseContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.phaseTitle}>Importando usuarios...</Text>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
                  </Text>
                </View>

                {/* Current user */}
                {currentUser && (
                  <Text style={styles.currentUserText}>
                    Procesando: {currentUser.nombre} ({currentUser.email})
                  </Text>
                )}

                {/* Live counters */}
                <View style={styles.counterRow}>
                  <View style={styles.counterBox}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.counterText}>{results.success.length} creados</Text>
                  </View>
                  <View style={styles.counterBox}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                    <Text style={styles.counterText}>{results.errors.length} errores</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
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
    maxHeight: '85%',
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
  phaseContainer: {
    alignItems: 'center',
    gap: 16,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  phaseDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  fileInputContainer: {
    width: '100%',
    marginTop: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exampleBox: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  exampleCode: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
  },
  exampleCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    color: colors.text,
  },
  downloadLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  downloadLinkText: {
    fontSize: 14,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.successLight || '#e8f5e9',
    padding: 16,
    borderRadius: 8,
    width: '100%',
  },
  summaryBoxError: {
    backgroundColor: colors.warningLight || '#fff3e0',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  errorDetailsBox: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    maxHeight: 200,
  },
  errorDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  errorList: {
    maxHeight: 150,
  },
  errorItem: {
    marginBottom: 8,
  },
  errorItemText: {
    fontSize: 13,
    color: colors.error,
  },
  errorMore: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    width: '100%',
    gap: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  currentUserText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
});
