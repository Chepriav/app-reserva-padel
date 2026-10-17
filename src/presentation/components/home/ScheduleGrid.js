import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SlotGridSkeleton } from '../Skeleton';
import { colors } from '../../../constants/colors';
import { formatReadableDate, hasSlotEnded } from '../../../utils/dateHelpers';
import { getGapBefore } from '../../../utils/scheduleGaps';
import { TimeSlotChip } from './TimeSlotChip';

/**
 * Full-width row shown where the grid skips time (configured break)
 */
function BreakSeparator({ gap }) {
  return (
    <View style={styles.breakRow}>
      <View style={styles.breakLine} />
      <Text style={styles.breakText}>Pausa · {gap.start} – {gap.end}</Text>
      <View style={styles.breakLine} />
    </View>
  );
}

// Slots that already ended today are hidden: what's bookable shows first
const upcomingSlots = (slots, date) => slots.filter((s) => !hasSlotEnded(date, s.endTime));

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
    return <Text style={styles.emptyText}>No hay horarios disponibles</Text>;
  }

  const visible = upcomingSlots(timeSlots, date);
  if (visible.length === 0) {
    return <Text style={styles.emptyText}>Por hoy ya no quedan horarios. Elige otro día.</Text>;
  }

  return (
    <View style={styles.slotsGrid}>
      {visible.map((timeSlot, index) => {
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

        const gap = getGapBefore(visible, index);

        return (
          <React.Fragment key={timeSlot.startTime}>
            {gap && <BreakSeparator gap={gap} />}
            <TimeSlotChip
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
          </React.Fragment>
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
    return <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>;
  }
  const dates = Object.keys(timeSlotsSemanales);

  if (dates.length === 0) {
    return <Text style={styles.emptyText}>No hay horarios disponibles esta semana</Text>;
  }

  return (
    <>
      {dates.map((date) => {
        const timeSlotsDay = upcomingSlots(timeSlotsSemanales[date], date);
        if (timeSlotsDay.length === 0) return null;
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

                const gap = getGapBefore(timeSlotsDay, index);

                return (
                  <React.Fragment key={timeSlot.startTime}>
                    {gap && <BreakSeparator gap={gap} />}
                    <TimeSlotChip
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
                  </React.Fragment>
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
    return <SlotGridSkeleton />;
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
  breakRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  breakLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  breakText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
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
    borderWidth: 1,
    borderColor: colors.border,
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
