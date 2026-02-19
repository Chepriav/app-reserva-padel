import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { csvImportService } from '../../../services/csvImportService';
import { useImportModal } from '../../hooks/useImportModal';
import { styles } from './ImportUsersModalStyles';

/**
 * Modal for importing users from CSV file
 * Three phases: select → validate → importing
 */
export function ImportUsersModal({ visible, onClose, onComplete, onImport }) {
  const {
    phase,
    validationResult,
    importing,
    progress,
    currentUser,
    results,
    handleFileSelect,
    handleStartImport,
    handleCancel,
    handleTryAgain,
  } = useImportModal({ visible, onClose, onImport, onComplete });

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

                <View style={styles.exampleBox}>
                  <Text style={styles.exampleTitle}>Formato esperado:</Text>
                  <View style={styles.exampleCode}>
                    <Text style={styles.exampleCodeText}>nombre,codigo,email</Text>
                    <Text style={styles.exampleCodeText}>Juan Pérez,1-3-B,juan@example.com</Text>
                    <Text style={styles.exampleCodeText}>María López,2-4-C,maria@example.com</Text>
                  </View>
                </View>

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
                  <>
                    <Text style={styles.phaseTitle}>Validación completada</Text>

                    {validationResult.validRows.length > 0 && (
                      <View style={styles.summaryBox}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        <Text style={styles.summaryText}>
                          {validationResult.validRows.length} usuarios válidos
                        </Text>
                      </View>
                    )}

                    {validationResult.rowErrors.length > 0 && (
                      <View style={[styles.summaryBox, styles.summaryBoxError]}>
                        <Ionicons name="warning" size={24} color={colors.warning} />
                        <Text style={styles.summaryText}>
                          {validationResult.rowErrors.length} errores encontrados
                        </Text>
                      </View>
                    )}

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

                {currentUser && (
                  <Text style={styles.currentUserText}>
                    Procesando: {currentUser.nombre} ({currentUser.email})
                  </Text>
                )}

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
