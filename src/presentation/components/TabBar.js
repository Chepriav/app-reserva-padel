import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Shared top tabs (Mis Reservas, Partidas, Tablón, Admin).
 * tabs: [{ key, label, count?, alert? }]
 *   - count: neutral number pill (e.g. how many items)
 *   - alert: red number pill (e.g. unread / pending)
 */
export function TabBar({ tabs, activeKey, onChange, style }) {
  return (
    <View style={[styles.bar, style]} accessibilityRole="tablist">
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
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
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
    marginHorizontal: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    backgroundColor: 'transparent',
  },
  indicatorActive: {
    backgroundColor: colors.primary,
  },
});
