import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, Easing, Platform, Pressable } from 'react-native';

// Shared, subtle motion primitives. All of them turn off when the user has
// "reduce motion" enabled in their system settings.

const useNativeDriver = Platform.OS !== 'web';
const EASE_OUT = Easing.out(Easing.cubic);

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled?.()
  .then((value) => { reduceMotion = !!value; })
  .catch(() => {});
AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value) => { reduceMotion = !!value; });

export function prefersReducedMotion() {
  return reduceMotion;
}

/**
 * Fades and slides its children in when mounted.
 * Give it a `key` that changes (e.g. the active tab) to replay the entrance.
 */
export function FadeIn({ children, offset = 8, duration = 220, delay = 0, style }) {
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: EASE_OUT,
      useNativeDriver,
    }).start();
  }, [progress, duration, delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] });
  return (
    <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

/**
 * Pressable that shrinks slightly while pressed, so taps feel physical.
 * `style` is applied to the animated inner view.
 */
export function PressableScale({ children, style, scaleTo = 0.94, disabled, ...pressableProps }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue) => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue, speed: 40, bounciness: 6, useNativeDriver }).start();
  };

  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      onPressIn={() => animateTo(scaleTo)}
      onPressOut={() => animateTo(1)}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/**
 * 0 → 1 value that follows a boolean (e.g. expanded / visible).
 */
export function useToggleAnimation(active, duration = 200) {
  const value = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    if (reduceMotion) { value.setValue(active ? 1 : 0); return; }
    Animated.timing(value, {
      toValue: active ? 1 : 0,
      duration,
      easing: EASE_OUT,
      useNativeDriver,
    }).start();
  }, [value, active, duration]);

  return value;
}
