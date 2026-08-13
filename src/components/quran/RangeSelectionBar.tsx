import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

interface RangeSelectionBarProps {
  startAyah: number | null;
  endAyah: number | null;
  isRangeComplete: boolean;
  onStartPractice: () => void;
  onClearSelection: () => void;
}

/**
 * Slide-up bar that appears once an ayah selection exists. While the user
 * is choosing a range it shows a hint; once the range is complete it offers
 * Clear / Start Practice CTAs.
 */
export function RangeSelectionBar({
  startAyah,
  endAyah,
  isRangeComplete,
  onStartPractice,
  onClearSelection,
}: RangeSelectionBarProps) {
  const insets = useSafeAreaInsets();
  const strings = useStrings();
  const theme = useTheme();
  const styles = createStyles(theme);

  if (startAyah === null) {
    return null;
  }

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown.springify().damping(18)}
      style={[
        styles.container,
        { paddingBottom: insets.bottom > 0 ? insets.bottom : theme.spacing.md },
      ]}
    >
      {!isRangeComplete ? (
        <Text style={styles.selectionText}>{strings.ayahSelected(startAyah)}</Text>
      ) : (
        <View style={styles.completeRow}>
          <Text style={styles.selectionText}>
            {strings.ayahsSelected(startAyah!, endAyah!)}
          </Text>
          <View style={styles.buttonsRow}>
            <Pressable
              onPress={onClearSelection}
              hitSlop={8}
              accessibilityLabel="Clear Selection"
              accessibilityRole="button"
            >
              <Text style={styles.clearButtonText}>{strings.clearSelection}</Text>
            </Pressable>
            <Pressable
              onPress={onStartPractice}
              style={({ pressed }) => [
                styles.startBtn,
                pressed && styles.startBtnPressed,
              ]}
              accessibilityLabel="Start Practice"
              accessibilityRole="button"
            >
              <Text style={styles.startBtnText}>{strings.startPractice}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.semantic.bgRaised,
      borderTopColor: theme.semantic.border,
      borderTopWidth: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.md,
      minHeight: 64,
      ...theme.elevation.shadow3,
    },
    selectionText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: 'center',
      flex: 1,
    },
    completeRow: {
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
    },
    buttonsRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.md,
    },
    clearButtonText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 16,
      color: theme.semantic.fgMuted,
    },
    startBtn: {
      backgroundColor: theme.semantic.primary,
      height: 44,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    startBtnPressed: {
      backgroundColor: theme.semantic.primaryPressed,
    },
    startBtnText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 15,
      color: theme.semantic.fgOnPrimary,
      fontWeight: '600',
    },
  });
}
