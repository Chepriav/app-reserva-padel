import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { colors } from '../../../constants/colors';

/**
 * Cabecera de HomeScreen con saludo y switch de modo bloqueo
 */
export function HomeHeader({ userName, isAdmin, blockoutMode, onModoBlockoutChange }) {
  return (
    <View style={[styles.header, blockoutMode && styles.headerModoBlockout]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.subtitle}>
            {blockoutMode ? '🔒 Modo Bloqueo activo' : 'Selecciona pista y horario'}
          </Text>
        </View>
        {isAdmin && (
          <View style={styles.modoBlockoutContainer}>
            <Text style={styles.modoBlockoutLabel}>Bloqueo</Text>
            <Switch
              value={blockoutMode}
              onValueChange={onModoBlockoutChange}
              trackColor={{ false: '#767577', true: colors.blocked }}
              thumbColor={blockoutMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 40,
  },
  headerModoBlockout: {
    backgroundColor: colors.blocked,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  modoBlockoutContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modoBlockoutLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
