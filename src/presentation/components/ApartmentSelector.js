import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../constants/colors';
import { VIVIENDA_CONFIG } from '../constants/config';

/**
 * Componente selector de vivienda estructurada
 * Permite seleccionar Escalera, Piso y Puerta
 */
export function ViviendaSelector({
  escalera,
  piso,
  puerta,
  onChangeEscalera,
  onChangePiso,
  onChangePuerta,
  disabled = false,
}) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState(null); // 'escalera' | 'piso' | 'puerta'

  const openModal = (type) => {
    if (disabled) return;
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (value) => {
    if (modalType === 'escalera') {
      onChangeEscalera(value.toString());
    } else if (modalType === 'piso') {
      onChangePiso(value.toString());
    } else if (modalType === 'puerta') {
      onChangePuerta(value);
    }
    setModalVisible(false);
  };

  const getOptions = () => {
    switch (modalType) {
      case 'escalera':
        return VIVIENDA_CONFIG.escaleras;
      case 'piso':
        return VIVIENDA_CONFIG.pisos;
      case 'puerta':
        return VIVIENDA_CONFIG.puertas;
      default:
        return [];
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'escalera':
        return 'Selecciona Escalera';
      case 'piso':
        return 'Selecciona Piso';
      case 'puerta':
        return 'Selecciona Puerta';
      default:
        return '';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectorsRow}>
        {/* Escalera */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Escalera</Text>
          <TouchableOpacity
            style={[styles.selector, disabled && styles.selectorDisabled]}
            onPress={() => openModal('escalera')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !escalera && styles.placeholder]}>
              {escalera || '-'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Piso */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Piso</Text>
          <TouchableOpacity
            style={[styles.selector, disabled && styles.selectorDisabled]}
            onPress={() => openModal('piso')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !piso && styles.placeholder]}>
              {piso || '-'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Puerta */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Puerta</Text>
          <TouchableOpacity
            style={[styles.selector, disabled && styles.selectorDisabled]}
            onPress={() => openModal('puerta')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !puerta && styles.placeholder]}>
              {puerta || '-'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de selección - Solo renderizar cuando está visible */}
      {modalVisible && (
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>{getModalTitle()}</Text>
              <ScrollView style={styles.optionsList}>
                {getOptions().map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.optionItem}
                    onPress={() => handleSelect(option)}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Sin marginBottom - el contenedor padre ya lo tiene
  },
  selectorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectorContainer: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 6,
  },
  selector: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  selectorDisabled: {
    backgroundColor: colors.background,
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    color: colors.disabled,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: 200,
    maxWidth: '60%',
    maxHeight: '50%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  optionsList: {
    maxHeight: 250,
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

// Re-export with English name
export { ViviendaSelector as ApartmentSelector };
