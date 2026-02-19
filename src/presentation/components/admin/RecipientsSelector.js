import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

export function SelectorDestinatarios({
  usuarios,
  seleccionados,
  onSeleccionChange,
  loading,
}) {
  const [busqueda, setBusqueda] = useState('');

  const usuariosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return usuarios;
    const termino = busqueda.toLowerCase();
    return usuarios.filter(
      u =>
        u.nombre.toLowerCase().includes(termino) ||
        u.vivienda.toLowerCase().includes(termino) ||
        u.email.toLowerCase().includes(termino)
    );
  }, [usuarios, busqueda]);

  const toggleUsuario = (userId) => {
    if (seleccionados.includes(userId)) {
      onSeleccionChange(seleccionados.filter(id => id !== userId));
    } else {
      onSeleccionChange([...seleccionados, userId]);
    }
  };

  const seleccionarTodos = () => {
    if (seleccionados.length === usuariosFiltrados.length) {
      onSeleccionChange([]);
    } else {
      onSeleccionChange(usuariosFiltrados.map(u => u.id));
    }
  };

  const renderUsuario = ({ item }) => {
    const isSelected = seleccionados.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.usuarioItem, isSelected && styles.usuarioItemSelected]}
        onPress={() => toggleUsuario(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.usuarioInfo}>
          <Text style={styles.usuarioNombre}>{item.nombre}</Text>
          <Text style={styles.usuarioVivienda}>{item.vivienda}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          Seleccionar destinatarios ({seleccionados.length})
        </Text>
        <TouchableOpacity onPress={seleccionarTodos}>
          <Text style={styles.selectAllText}>
            {seleccionados.length === usuariosFiltrados.length ? 'Deseleccionar' : 'Seleccionar todos'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={colors.disabled} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, vivienda..."
          placeholderTextColor={colors.disabled}
          value={busqueda}
          onChangeText={setBusqueda}
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')}>
            <Ionicons name="close-circle" size={18} color={colors.disabled} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={usuariosFiltrados}
        renderItem={renderUsuario}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron usuarios</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  selectAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    paddingVertical: Platform.OS === 'ios' ? 4 : 0,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 4,
  },
  usuarioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  usuarioItemSelected: {
    backgroundColor: `${colors.primary}10`,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  usuarioInfo: {
    flex: 1,
  },
  usuarioNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  usuarioVivienda: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.disabled,
    paddingVertical: 20,
  },
});

// Re-export with English name
export { SelectorDestinatarios as RecipientsSelector };
