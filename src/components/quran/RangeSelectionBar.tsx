import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../constants/theme';
import { useStrings } from '../../constants/strings';

interface RangeSelectionBarProps {
  startAyah: number | null;
  endAyah: number | null;
  isRangeComplete: boolean;
  onStartPractice: () => void;
  onClearSelection: () => void;
}

/**
 * Fixed bottom bar for ayah range selection.
 * Slides up when an ayah is selected, shows range summary and action buttons.
 *
 * States:
 * - one-selected: Shows "Ayah X selected - tap another ayah to set range end"
 * - range-complete: Shows "Ayahs X-Y selected" with Clear Selection and Start Practice buttons
 * - hidden: When no selection exists (renders null)
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

  // Not visible when no selection
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
        // State 1: one-selected
        <Text style={styles.selectionText}>
          {strings.ayahSelected(startAyah)}
        </Text>
      ) : (
        // State 2: range-complete
        <View style={styles.rangeCompleteRow}>
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
                styles.startPracticeButton,
                pressed && styles.startPracticeButtonPressed,
              ]}
              accessibilityLabel="Start Practice"
              accessibilityRole="button"
            >
              <Text style={styles.startPracticeText}>{strings.startPractice}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E2DA',
    paddingHorizontal: theme.spacing.md, // 16px
    paddingTop: theme.spacing.md, // 16px
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 64,
  },
  selectionText: {
    fontSize: theme.typography.body.size, // 18px
    color: theme.colors.text, // #1A1A2E
    textAlign: 'center',
    flex: 1,
  },
  rangeCompleteRow: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md, // 16px
  },
  clearButtonText: {
    fontSize: theme.typography.body.size, // 18px
    color: theme.colors.textSecondary, // #6B7280
  },
  startPracticeButton: {
    backgroundColor: '#0D7377', // Teal
    height: 44,
    paddingHorizontal: theme.spacing.md, // 16px
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startPracticeButtonPressed: {
    backgroundColor: '#0B6163',
  },
  startPracticeText: {
    fontSize: theme.typography.body.size, // 18px
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
