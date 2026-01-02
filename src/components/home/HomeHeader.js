import React from 'react';
import { View, Text, StyleSheet, Switch, Platform } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Cabecera de HomeScreen con saludo y switch de modo bloqueo
 */
export function HomeHeader({ userName, esAdmin, modoBloqueo, onModoBloqueoChange }) {
  return (
    <View style={[styles.header, modoBloqueo && styles.headerModoBloqueo]}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.subtitle}>
            {modoBloqueo ? '🔒 Modo Bloqueo activo' : 'Selecciona pista y horario'}
          </Text>
        </View>
        {esAdmin && (
          <View style={styles.modoBloqueoContainer}>
            <Text style={styles.modoBloqueoLabel}>Bloquear</Text>
            <Switch
              value={modoBloqueo}
              onValueChange={onModoBloqueoChange}
              trackColor={{ false: '#767577', true: colors.bloqueado }}
              thumbColor={modoBloqueo ? '#fff' : '#f4f3f4'}
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
  headerModoBloqueo: {
    backgroundColor: colors.bloqueado,
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
  modoBloqueoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modoBloqueoLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
