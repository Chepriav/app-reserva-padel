import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors } from '../../constants/colors';
import { prefersReducedMotion } from './Motion';

const BAR_PADDING = 8;
const INDICATOR_INSET = 12;

/**
 * Shared top tabs (Mis Reservas, Partidas, Tablón, Admin).
 * tabs: [{ key, label, count?, alert? }]
 *   - count: neutral number pill (e.g. how many items)
 *   - alert: red number pill (e.g. unread / pending)
 */
export function TabBar({ tabs, activeKey, onChange, style }) {
  const [barWidth, setBarWidth] = useState(0);
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.key === activeKey));
  const tabWidth = barWidth ? (barWidth - BAR_PADDING * 2) / tabs.length : 0;
  const targetX = BAR_PADDING + activeIndex * tabWidth + INDICATOR_INSET;

  // Sliding underline: jumps into place on first layout, glides afterwards
  const indicatorX = useRef(new Animated.Value(0)).current;
  const placed = useRef(false);
  useEffect(() => {
    if (!tabWidth) return;
    if (!placed.current || prefersReducedMotion()) {
      indicatorX.setValue(targetX);
      placed.current = true;
      return;
    }
    Animated.spring(indicatorX, {
      toValue: targetX,
      speed: 18,
      bounciness: 4,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [indicatorX, targetX, tabWidth]);

  return (
    <View
      style={[styles.bar, style]}
      accessibilityRole="tablist"
      onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const pill = tab.alert > 0 ? tab.alert : tab.count;
        const isAlert = tab.alert > 0;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            activeOpacity={0.7}
          >
            <View style={styles.labelRow}>
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {pill !== undefined && pill !== null && (
                <View
                  style={[
                    styles.pill,
                    active && styles.pillActive,
                    isAlert && styles.pillAlert,
                  ]}
                >
                  <Text
                    style={[
                      styles.pillText,
                      active && styles.pillTextActive,
                      isAlert && styles.pillTextAlert,
                    ]}
                  >
                    {pill}
                  </Text>
                </View>
              )}
            </View>
            {/* Static underline only until the bar has been measured */}
            <View style={[styles.indicator, active && !tabWidth && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
      {tabWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.slidingIndicator,
            { width: tabWidth - INDICATOR_INSET * 2, transform: [{ translateX: indicatorX }] },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: BAR_PADDING,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 12,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 30,
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: -0.1,
  },
  labelActive: {
    color: colors.primary,
  },
  pill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#edf2f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary + '14',
  },
  pillAlert: {
    backgroundColor: colors.error,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.primary,
  },
  pillTextAlert: {
    color: '#fff',
  },
  indicator: {
    height: 3,
    alignSelf: 'stretch',
    marginHorizontal: INDICATOR_INSET,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
  slidingIndicator: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: colors.primary,
  },
});
