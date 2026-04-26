import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

/**
 * Loading skeleton with shimmer animation. Renders 3 groups of 3 ayah-shaped
 * blocks each. Respects `reduceMotion` accessibility preference.
 */
export function LoadingSkeleton() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useSharedValue(-300);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => setReduceMotion(enabled)
    );
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      translateX.value = withRepeat(
        withTiming(300, { duration: 1500, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [reduceMotion, translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container} accessibilityLabel="Loading Quran text">
      {[0, 1, 2].map((groupIndex) => (
        <View key={groupIndex} style={styles.group}>
          <SkeletonBlock width="100%" shimmerStyle={shimmerStyle} reduceMotion={reduceMotion} />
          <SkeletonBlock width="85%" shimmerStyle={shimmerStyle} reduceMotion={reduceMotion} />
          <SkeletonBlock width="60%" shimmerStyle={shimmerStyle} reduceMotion={reduceMotion} />
        </View>
      ))}
    </View>
  );
}

interface SkeletonBlockProps {
  width: '100%' | '85%' | '60%';
  shimmerStyle: any;
  reduceMotion: boolean;
}

function SkeletonBlock({ width, shimmerStyle, reduceMotion }: SkeletonBlockProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={[styles.block, { width }]}>
      {!reduceMotion && <Animated.View style={[styles.shimmer, shimmerStyle]} />}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: theme.gutter.ayah,
      paddingTop: theme.spacing.lg,
    },
    group: {
      marginBottom: theme.spacing.lg,
    },
    block: {
      height: 22,
      borderRadius: theme.radii.sm,
      backgroundColor: theme.semantic.bgSunken,
      marginBottom: 12,
      overflow: 'hidden',
    },
    shimmer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: 100,
      backgroundColor: theme.semantic.bgRaised,
      opacity: 0.6,
    },
  });
}
