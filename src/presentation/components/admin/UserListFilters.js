import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';
import { USER_SORT_OPTIONS } from '../../hooks/useUserListFilter';

/**
 * Search box + sort chips for the admin user list
 */
export function UserListFilters({ query, onChangeQuery, sortBy, sortDirection, onChangeSort, shown, total }) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Nombre, vivienda o email"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Buscar usuarios"
        />
        {query.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeQuery('')}
            accessibilityLabel="Borrar búsqueda"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sortRow}
      >
        <Ionicons name="swap-vertical" size={16} color={colors.textSecondary} accessibilityLabel="Ordenar por" />
        {USER_SORT_OPTIONS.map((option) => {
          const active = option.key === sortBy;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => onChangeSort(option.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={
                active
                  ? `${option.label}, ${sortDirection === 'asc' ? 'ascendente' : 'descendente'}. Pulsa para invertir`
                  : `Ordenar por ${option.label}`
              }
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {option.label}
              </Text>
              {active && (
                <Ionicons
                  name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={13}
                  color="#fff"
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {shown !== total && (
        <Text style={styles.count}>
          Mostrando {shown} de {total}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 2,
    outlineStyle: 'none',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.text,
  },
  chipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  count: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
