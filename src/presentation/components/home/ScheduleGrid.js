import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../../constants/colors';
import { formatReadableDate, hasSlotEnded } from '../../../utils/dateHelpers';
import { TimeSlotChip } from './TimeSlotChip';

/**
 * Schedule grid for day view
 */
export function DayScheduleGrid({
  timeSlots,
  date,
  userApartment,
  selectedSlots = [],
  slotsToBlock = [],
  slotsToUnblock = [],
  blockoutMode,
  isAdmin,
  reservando,
  onTimeSlotPress,
}) {
  if (!timeSlots || timeSlots.length === 0) {
    return <Text style={styles.emptyText}>No hay timeSlots disponibles</Text>;
  }

  return (
    <View style={styles.slotsGrid}>
      {timeSlots.map((timeSlot, index) => {
        const estaSelected = selectedSlots.some(b =>
          b.date === date && b.startTime === timeSlot.startTime
        );
        const isSelectedForBlock = slotsToBlock.some(b =>
          b.date === date && b.startTime === timeSlot.startTime
        );
        const isSelectedForUnblock = slotsToUnblock.some(b =>
          b.date === date && b.startTime === timeSlot.startTime
        );

        const isPast = hasSlotEnded(date, timeSlot.endTime);
        const isBlocked = timeSlot.blocked;
        const isMyApartment = timeSlot.existingReservation?.apartment === userApartment;
        const isGuaranteedOrProtected = timeSlot.priority === 'guaranteed' || timeSlot.isProtected;
        const isOtherGuaranteed = !timeSlot.available && !isBlocked && !isMyApartment && isGuaranteedOrProtected;

        const estaDeshabilitado = reservando ||
          (isPast && !blockoutMode) ||
          (!blockoutMode && !isBlocked && (isOtherGuaranteed || isMyApartment));

        return (
          <TimeSlotChip
            key={index}
            timeSlot={timeSlot}
            date={date}
            userApartment={userApartment}
            estaSelected={estaSelected}
            isSelectedForBlock={isSelectedForBlock}
            isSelectedForUnblock={isSelectedForUnblock}
            blockoutMode={blockoutMode}
            disabled={estaDeshabilitado}
            onPress={() => onTimeSlotPress(timeSlot, date)}
          />
        );
      })}
    </View>
  );
}

/**
 * Schedule grid for week view
 */
export function WeekScheduleGrid({
  timeSlotsSemanales,
  userApartment,
  selectedSlots = [],
  slotsToBlock = [],
  slotsToUnblock = [],
  blockoutMode,
  isAdmin,
  reservando,
  onTimeSlotPress,
}) {
  if (!timeSlotsSemanales) {
    return <Text style={styles.emptyText}>No hay timeSlots disponibles esta week</Text>;
  }
  const dates = Object.keys(timeSlotsSemanales);

  if (dates.length === 0) {
    return <Text style={styles.emptyText}>No hay timeSlots disponibles esta week</Text>;
  }

  return (
    <>
      {dates.map((date) => {
        const timeSlotsDay = timeSlotsSemanales[date];
        const countDisponibles = timeSlotsDay.filter(h =>
          (h.available || h.isDisplaceable) && !h.blocked
        ).length;

        return (
          <View key={date} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayDate}>
                {formatReadableDate(date)}
              </Text>
              <View style={styles.availableBadge}>
                <Text style={styles.availableText}>
                  {countDisponibles} disponibles
                </Text>
              </View>
            </View>

            <View style={styles.slotsGrid}>
              {timeSlotsDay.map((timeSlot, index) => {
                const estaSelected = selectedSlots.some(b =>
                  b.date === date && b.startTime === timeSlot.startTime
                );
                const isSelectedForBlock = slotsToBlock.some(b =>
                  b.date === date && b.startTime === timeSlot.startTime
                );
                const isSelectedForUnblock = slotsToUnblock.some(b =>
                  b.date === date && b.startTime === timeSlot.startTime
                );

                const isPast = hasSlotEnded(date, timeSlot.endTime);
                const isBlocked = timeSlot.blocked;
                const isMyApartment = timeSlot.existingReservation?.apartment === userApartment;
                const isGuaranteedOrProtected = timeSlot.priority === 'guaranteed' || timeSlot.isProtected;
                const isOtherGuaranteed = !timeSlot.available && !isBlocked && !isMyApartment && isGuaranteedOrProtected;

                const estaDeshabilitado = reservando ||
                  (isPast && !blockoutMode) ||
                  (!blockoutMode && !isBlocked && (isOtherGuaranteed || isMyApartment));

                return (
                  <TimeSlotChip
                    key={index}
                    timeSlot={timeSlot}
                    date={date}
                    userApartment={userApartment}
                    estaSelected={estaSelected}
                    isSelectedForBlock={isSelectedForBlock}
                    isSelectedForUnblock={isSelectedForUnblock}
                    blockoutMode={blockoutMode}
                    disabled={estaDeshabilitado}
                    onPress={() => onTimeSlotPress(timeSlot, date)}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </>
  );
}

/**
 * Main schedule container
 */
export function ScheduleContainer({
  loading,
  viewActual,
  timeSlots,
  timeSlotsSemanales,
  dateSelected,
  userApartment,
  selectedSlots = [],
  slotsToBlock = [],
  slotsToUnblock = [],
  blockoutMode,
  isAdmin,
  reservando,
  onTimeSlotPress,
}) {
  if (loading) {
    return <ActivityIndicator size="large" color={colors.primary} />;
  }

  if (viewActual === 'dia') {
    return (
      <DayScheduleGrid
        timeSlots={timeSlots}
        date={dateSelected}
        userApartment={userApartment}
        selectedSlots={selectedSlots}
        slotsToBlock={slotsToBlock}
        slotsToUnblock={slotsToUnblock}
        blockoutMode={blockoutMode}
        isAdmin={isAdmin}
        reservando={reservando}
        onTimeSlotPress={onTimeSlotPress}
      />
    );
  }

  return (
    <WeekScheduleGrid
      timeSlotsSemanales={timeSlotsSemanales}
      userApartment={userApartment}
      selectedSlots={selectedSlots}
      slotsToBlock={slotsToBlock}
      slotsToUnblock={slotsToUnblock}
      blockoutMode={blockoutMode}
      isAdmin={isAdmin}
      reservando={reservando}
      onTimeSlotPress={onTimeSlotPress}
    />
  );
}

// Legacy aliases for backwards compatibility
export const TimeSlotsGridDay = DayScheduleGrid;
export const TimeSlotsGridWeek = WeekScheduleGrid;
export const TimeSlotsContainer = ScheduleContainer;

const styles = StyleSheet.create({
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  availableBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
});
