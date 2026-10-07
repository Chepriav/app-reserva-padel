import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../../../constants/colors';
import { formatReadableDate, getBookableDays, getDayPillLabel, getTodayDate } from '../../../utils/dateHelpers';

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Horizontal strip with every bookable day (day view)
 */
function DayStrip({ dateSelected, onSelectDate }) {
  const today = getTodayDate();
  const days = getBookableDays();

  return (
    <View style={styles.stripContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripContent}
      >
        {days.map((day) => {
          const isSelected = day === dateSelected;
          const label = getDayPillLabel(day, today);
          return (
            <TouchableOpacity
              key={day}
              style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              onPress={() => onSelectDate(day)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={formatReadableDate(day)}
            >
              <Text style={[styles.dayPillTop, isSelected && styles.dayPillTextSelected]}>
                {label.top}
              </Text>
              <Text style={[styles.dayPillDay, isSelected && styles.dayPillTextSelected]}>
                {label.day}
              </Text>
              <Text style={[styles.dayPillMonth, isSelected && styles.dayPillTextSelected]}>
                {label.month}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Text style={styles.stripCaption}>{capitalize(formatReadableDate(dateSelected))}</Text>
    </View>
  );
}

/**
 * Date navigator: day strip in day view, arrows in week view
 */
export function DateSelector({ dateSelected, viewActual, onCambiarDate, onSelectDate }) {
  if (viewActual === 'dia' && onSelectDate) {
    return <DayStrip dateSelected={dateSelected} onSelectDate={onSelectDate} />;
  }

  return (
    <View style={styles.dateContainer}>
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onCambiarDate(-1)}
      >
        <Text style={styles.dateButtonText}>←</Text>
      </TouchableOpacity>

      <View style={styles.dateInfo}>
        <Text style={styles.dateText}>
          {viewActual === 'dia'
            ? formatReadableDate(dateSelected)
            : 'Semana del ' + formatReadableDate(dateSelected)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => onCambiarDate(1)}
      >
        <Text style={styles.dateButtonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stripContainer: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stripContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayPill: {
    width: 56,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPillTop: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  dayPillDay: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 2,
  },
  dayPillMonth: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  dayPillTextSelected: {
    color: '#fff',
  },
  stripCaption: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 16,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateButton: {
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
  },
  dateButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  dateInfo: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
});
