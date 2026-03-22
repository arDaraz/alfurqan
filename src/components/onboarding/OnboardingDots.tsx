import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { theme } from '../../constants/theme';

interface OnboardingDotsProps {
  total: number;
  active: number;
}

export function OnboardingDots({ total, active }: OnboardingDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <Dot key={index} isActive={index === active} />
      ))}
    </View>
  );
}

function Dot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 10 : 8, { damping: 15, stiffness: 150 }),
      height: withSpring(isActive ? 10 : 8, { damping: 15, stiffness: 150 }),
      backgroundColor: withSpring(
        isActive ? theme.colors.primary : theme.colors.textDisabled,
        { damping: 15, stiffness: 150 }
      ),
    };
  }, [isActive]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  dot: {
    borderRadius: 5,
  },
});
