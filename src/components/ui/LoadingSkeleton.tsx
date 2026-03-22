import React, { useEffect, useState } from 'react';
import { View, StyleSheet, AccessibilityInfo } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

/**
 * Loading skeleton with shimmer animation for Quran text loading state.
 * Renders 3 groups of 3 blocks each to fill the screen.
 * Respects reduced motion accessibility preference.
 */
export function LoadingSkeleton() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useSharedValue(-300);

  useEffect(() => {
    // Check reduced motion preference
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        setReduceMotion(enabled);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!reduceMotion) {
      translateX.value = withRepeat(
        withTiming(300, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1, // infinite
        false // no reverse
      );
    }
  }, [reduceMotion, translateX]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

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
  shimmerStyle: ReturnType<typeof useAnimatedStyle>;
  reduceMotion: boolean;
}

function SkeletonBlock({ width, shimmerStyle, reduceMotion }: SkeletonBlockProps) {
  return (
    <View style={[styles.block, { width }]}>
      {!reduceMotion && (
        <Animated.View style={[styles.shimmer, shimmerStyle]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.xl, // 32px matching AyahText padding
    paddingTop: theme.spacing.lg, // 24px
  },
  group: {
    marginBottom: theme.spacing.lg, // 24px between groups
  },
  block: {
    height: 20,
    borderRadius: 8,
    backgroundColor: '#E5E2DA', // Divider color
    marginBottom: 12, // 12px gap between blocks (internal layout detail)
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FAF8F2', // Cream at overlay
    opacity: 0.5,
  },
});
