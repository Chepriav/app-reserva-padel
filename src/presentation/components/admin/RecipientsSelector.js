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

export function SelectorRecipients({
  users,
  selected,
  onSelectionChange,
  loading,
}) {
  const [busqueda, setBusqueda] = useState('');

  const usersFiltrados = useMemo(() => {
    if (!busqueda.trim()) return users;
    const termino = busqueda.toLowerCase();
    return users.filter(
      u =>
        u.name.toLowerCase().includes(termino) ||
        u.apartment.toLowerCase().includes(termino) ||
        u.email.toLowerCase().includes(termino)
    );
  }, [users, busqueda]);

  const toggleUser = (userId) => {
    if (selected.includes(userId)) {
      onSelectionChange(selected.filter(id => id !== userId));
    } else {
      onSelectionChange([...selected, userId]);
    }
  };

  const selectTodos = () => {
    if (selected.length === usersFiltrados.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(usersFiltrados.map(u => u.id));
    }
  };

  const renderUser = ({ item }) => {
    const isSelected = selected.includes(item.id);

    return (
      <TouchableOpacity
        style={[styles.userItem, isSelected && styles.userItemSelected]}
        onPress={() => toggleUser(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userApartment}>{item.apartment}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Cargando users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>
          Select recipients ({selected.length})
        </Text>
        <TouchableOpacity onPress={selectTodos}>
          <Text style={styles.selectAllText}>
            {selected.length === usersFiltrados.length ? 'Deseleccionar' : 'Seleccionar todos'}
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
        data={usersFiltrados}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No se encontraron users</Text>
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
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  userItemSelected: {
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
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  userApartment: {
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
export { SelectorRecipients as RecipientsSelector };
