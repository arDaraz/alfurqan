import React from 'react';
import { Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useReadingStore } from '../../stores/readingStore';
import { theme } from '../../constants/theme';

interface ResumeReadingFABProps {
  onPress: () => void;
}

export function ResumeReadingFAB({ onPress }: ResumeReadingFABProps) {
  const lastReadSurah = useReadingStore((state) => state.lastReadSurah);

  if (lastReadSurah === null) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Continue reading"
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.fab,
        pressed && styles.fabPressed,
      ]}
    >
      <MaterialCommunityIcons
        name="book-open-page-variant"
        size={24}
        color={theme.colors.surface}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0D7377',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  fabPressed: {
    backgroundColor: '#0B6163',
  },
});
