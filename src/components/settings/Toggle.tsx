import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  value: boolean;
  onValueChange: (next: boolean) => void;
  accessibilityLabel?: string;
}

/**
 * Toggle switch — colour change *and* knob position to disambiguate
 * on/off states (the design notes single-cue toggles fail accessibility
 * for colour-blind users).
 */
export function Toggle({ value, onValueChange, accessibilityLabel }: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      role="switch"
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.knob, value ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    track: {
      width: 44,
      height: 26,
      borderRadius: 13,
      justifyContent: 'center',
    },
    trackOn: { backgroundColor: theme.semantic.primary },
    trackOff: { backgroundColor: theme.semantic.borderStrong },
    knob: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: theme.palette.paper[50],
      ...theme.elevation.shadow1,
    },
    knobOn: { marginLeft: 2 },
    knobOff: { marginLeft: 20 },
  });
}
