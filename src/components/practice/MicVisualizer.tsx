import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';

const HEIGHTS = [14, 22, 30, 38, 44, 36, 26, 18, 12];
const DELAYS = [-100, -200, 0, -300, -150, -50, -250, -400, -200];

/**
 * Live mic waveform — 9 bars with phased scaleY animation. The design's
 * notes say this should reflect *real* mic input; this component is the
 * placeholder until speech-recognition is wired up.
 */
export function MicVisualizer() {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {HEIGHTS.map((h, i) => (
        <Bar key={i} height={h} delay={DELAYS[i]} color={theme.semantic.primary} />
      ))}
    </View>
  );
}

function Bar({ height, delay, color }: { height: number; delay: number; color: string }) {
  const scale = useSharedValue(0.4);
  useEffect(() => {
    const start = () => {
      scale.value = withRepeat(
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      );
    };
    if (delay < 0) {
      // Phase the bars by waiting `|delay|` ms before starting
      const t = setTimeout(start, Math.abs(delay));
      return () => clearTimeout(t);
    }
    start();
  }, [scale, delay]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          height,
          borderRadius: 2,
          backgroundColor: color,
          opacity: 0.85,
        },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    height: 48,
  },
});
