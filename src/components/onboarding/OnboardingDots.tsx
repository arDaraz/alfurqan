import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

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
  const theme = useTheme();
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 24 : 8, { damping: 15, stiffness: 150 }),
      height: withSpring(8, { damping: 15, stiffness: 150 }),
      backgroundColor: withSpring(
        isActive ? theme.semantic.primary : theme.semantic.borderStrong,
        { damping: 15, stiffness: 150 }
      ),
    };
  }, [isActive, theme]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    borderRadius: 4,
  },
});
