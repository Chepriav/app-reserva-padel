import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { colors } from '../../constants/colors';
import { APARTMENT_CONFIG } from '../../constants/config';

/**
 * Componente selector de vivienda estructurada
 * Permite seleccionar Escalera, Piso y Puerta
 */
export function ApartmentSelector({
  staircase,
  floor,
  door,
  onChangeStaircase,
  onChangeFloor,
  onChangeDoor,
  disabled = false,
}) {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [modalType, setModalType] = React.useState(null); // 'staircase' | 'floor' | 'door'

  const openModal = (type) => {
    if (disabled) return;
    setModalType(type);
    setModalVisible(true);
  };

  const handleSelect = (value) => {
    if (modalType === 'staircase') {
      onChangeStaircase(value.toString());
    } else if (modalType === 'floor') {
      onChangeFloor(value.toString());
    } else if (modalType === 'door') {
      onChangeDoor(value);
    }
    setModalVisible(false);
  };

  const getOptions = () => {
    switch (modalType) {
      case 'staircase':
        return APARTMENT_CONFIG.stairs;
      case 'floor':
        return APARTMENT_CONFIG.floors;
      case 'door':
        return APARTMENT_CONFIG.doors;
      default:
        return [];
    }
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'staircase':
        return 'Selecciona Escalera';
      case 'floor':
        return 'Selecciona Piso';
      case 'door':
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
            onPress={() => openModal('staircase')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !staircase && styles.placeholder]}>
              {staircase || '-'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Piso */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Piso</Text>
          <TouchableOpacity
            style={[styles.selector, disabled && styles.selectorDisabled]}
            onPress={() => openModal('floor')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !floor && styles.placeholder]}>
              {floor || '-'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Puerta */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Puerta</Text>
          <TouchableOpacity
            style={[styles.selector, disabled && styles.selectorDisabled]}
            onPress={() => openModal('door')}
            disabled={disabled}
          >
            <Text style={[styles.selectorText, !door && styles.placeholder]}>
              {door || '-'}
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

