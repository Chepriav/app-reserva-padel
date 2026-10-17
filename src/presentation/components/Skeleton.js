import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';

const BASE = '#e6ebf1';

/**
 * Grey placeholder block with a soft pulse, shown while content loads.
 */
export function Skeleton({ width = '100%', height = 14, radius = 6, style }) {
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0.55, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: BASE, opacity }, style]}
    />
  );
}

/** Placeholder for the time-slot grid on Inicio */
export function SlotGridSkeleton({ count = 15 }) {
  return (
    <View style={styles.grid} accessibilityLabel="Cargando horarios">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} width={64} height={44} radius={10} />
      ))}
    </View>
  );
}

/** Placeholder for a list of cards (Partidas, Tablón...) */
export function CardListSkeleton({ count = 3 }) {
  return (
    <View accessibilityLabel="Cargando">
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.cardHeader}>
            <Skeleton width={40} height={40} radius={20} />
            <View style={styles.cardLines}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="35%" height={12} />
            </View>
          </View>
          <Skeleton width="90%" height={12} />
          <Skeleton width="70%" height={12} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardLines: {
    flex: 1,
    gap: 6,
  },
});
