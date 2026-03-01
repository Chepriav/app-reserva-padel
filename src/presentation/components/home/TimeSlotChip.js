import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../../../constants/colors';
import { hasSlotEnded } from '../../../utils/dateHelpers';

/**
 * Individual time slot chip with all visual states
 */
export function TimeSlotChip({
  timeSlot,
  date,
  userApartment,
  estaSelected,
  isSelectedForBlock,
  isSelectedForUnblock,
  blockoutMode,
  disabled,
  onPress,
}) {
  // Calculate slot states
  const states = useMemo(() => {
    const isPast = hasSlotEnded(date, timeSlot.endTime);
    const isBlocked = timeSlot.blocked;
    const isMyApartment = timeSlot.existingReservation?.apartment === userApartment;
    const isGuaranteedOrProtected = timeSlot.priority === 'guaranteed' || timeSlot.isProtected;
    const isProvisionalDisplaceable = timeSlot.priority === 'provisional' && !timeSlot.isProtected;

    const isMyGuaranteed = !timeSlot.available && !isBlocked && isMyApartment && isGuaranteedOrProtected;
    const isMyProvisional = !timeSlot.available && !isBlocked && isMyApartment && isProvisionalDisplaceable;
    const isOtherGuaranteed = !timeSlot.available && !isBlocked && !isMyApartment && isGuaranteedOrProtected;
    const isOtherProvisional = !timeSlot.available && !isBlocked && !isMyApartment && isProvisionalDisplaceable;

    return {
      isPast,
      isBlocked,
      isMyApartment,
      isMyGuaranteed,
      isMyProvisional,
      isOtherGuaranteed,
      isOtherProvisional,
    };
  }, [timeSlot, date, userApartment]);

  const {
    isPast,
    isBlocked,
    isMyGuaranteed,
    isMyProvisional,
    isOtherGuaranteed,
    isOtherProvisional,
  } = states;

  // Show lock icon for blocked slots
  const showIconoBlocked = !isPast && isBlocked && !isSelectedForUnblock;
  // Show displaceable icon
  const showIconoDisplaceable = !isPast && !isBlocked && isOtherProvisional;

  // Show apartment below time only for reserved (non-selection) slots
  const apartment = timeSlot.existingReservation?.apartment;
  const showApartment = !!apartment && !estaSelected && !isSelectedForBlock && !isSelectedForUnblock;

  const textColorStyles = [
    isPast && styles.slotChipTextPast,
    !isPast && isBlocked && !isSelectedForUnblock && styles.slotChipTextBlocked,
    !isPast && !isBlocked && (isMyGuaranteed || isMyProvisional) && styles.slotChipTextWhite,
    !isPast && !isBlocked && (isOtherGuaranteed || isOtherProvisional) && styles.slotChipTextDark,
    estaSelected && styles.slotChipTextSelected,
    (isSelectedForBlock || isSelectedForUnblock) && styles.slotChipTextSelected,
  ];

  return (
    <TouchableOpacity
      style={[
        styles.slotChip,
        isPast && styles.slotChipPast,
        !isPast && isBlocked && styles.slotChipBlocked,
        !isPast && !isBlocked && isMyGuaranteed && styles.slotChipMyGuaranteed,
        !isPast && !isBlocked && isMyProvisional && styles.slotChipMyProvisional,
        !isPast && !isBlocked && isOtherGuaranteed && styles.slotChipOtherGuaranteed,
        !isPast && !isBlocked && isOtherProvisional && styles.slotChipOtherProvisional,
        estaSelected && styles.slotChipSelected,
        isSelectedForBlock && styles.slotChipSelectedBlock,
        isSelectedForUnblock && styles.slotChipSelectedUnblock,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.slotChipText, ...textColorStyles]}>
        {timeSlot.startTime}
      </Text>
      {showApartment && (
        <Text
          style={[styles.slotChipApartment, ...textColorStyles]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {apartment}
        </Text>
      )}

      {showIconoBlocked && (
        <View style={styles.blockedIcon}>
          <Text style={styles.blockedIconText}>🔒</Text>
        </View>
      )}

      {showIconoDisplaceable && (
        <View style={styles.displaceableIcon}>
          <Text style={styles.displaceableIconText}>!</Text>
        </View>
      )}

      {estaSelected && (
        <View style={styles.checkMark}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {isSelectedForBlock && (
        <View style={styles.checkMarkBlock}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}

      {isSelectedForUnblock && (
        <View style={styles.checkMarkUnblock}>
          <Text style={styles.checkMarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  slotChip: {
    backgroundColor: colors.primary,
    paddingVertical: 4,
    borderRadius: 8,
    width: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  slotChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  slotChipApartment: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
    color: '#fff',
  },
  // Past states
  slotChipPast: {
    backgroundColor: colors.disabled,
    opacity: 0.4,
  },
  slotChipTextPast: {
    color: colors.textSecondary,
  },
  // Blocked states
  slotChipBlocked: {
    backgroundColor: colors.disabled,
    borderWidth: 2,
    borderColor: colors.blockout,
    opacity: 0.7,
  },
  slotChipTextBlocked: {
    color: colors.textSecondary,
  },
  // My apartment
  slotChipMyGuaranteed: {
    backgroundColor: colors.guaranteedReservation,
  },
  slotChipMyProvisional: {
    backgroundColor: colors.provisionalReservation,
  },
  slotChipTextWhite: {
    color: '#fff',
  },
  // Other apartment
  slotChipOtherGuaranteed: {
    backgroundColor: colors.displaceable,
    borderWidth: 2,
    borderColor: colors.guaranteedReservation,
  },
  slotChipOtherProvisional: {
    backgroundColor: colors.displaceable,
    borderWidth: 2,
    borderColor: colors.provisionalReservation,
  },
  slotChipTextDark: {
    color: colors.text,
  },
  // Selected for reservation
  slotChipSelected: {
    backgroundColor: colors.accent,
  },
  slotChipTextSelected: {
    color: '#fff',
  },
  // Selected for block
  slotChipSelectedBlock: {
    backgroundColor: colors.blockout,
    borderWidth: 2,
    borderColor: '#b71c1c',
  },
  // Selected for unblock
  slotChipSelectedUnblock: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: '#1b5e20',
  },
  // Icons
  blockedIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.blockout,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockedIconText: {
    fontSize: 10,
  },
  displaceableIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.provisionalReservation,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  displaceableIconText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Checkmarks
  checkMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMarkText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: 'bold',
  },
  checkMarkBlock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.blockout,
  },
  checkMarkUnblock: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondary,
  },
});
