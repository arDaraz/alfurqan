import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type { Theme } from '../../constants/theme';
import type { BookmarkCategory } from '../../data/types';

const VISIBLE_MS = 3500;

interface BookmarkSavedSnackbarProps {
  surahName: string;
  pageNumber: number;
  juzNumber: number;
  resultingCategories: BookmarkCategory[];
  /** Confirms a completed Undo: restates the restored state and drops the Undo action. */
  undone?: boolean;
  onUndo: () => void;
  onDismiss: () => void;
}

export function BookmarkSavedSnackbar({
  surahName,
  pageNumber,
  juzNumber,
  resultingCategories,
  undone = false,
  onUndo,
  onDismiss,
}: BookmarkSavedSnackbarProps) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme);

  useEffect(() => {
    const timer = setTimeout(onDismiss, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [onDismiss, surahName, pageNumber, juzNumber]);

  const pageText = isArabic ? toArabicIndic(pageNumber) : pageNumber;
  const juzText = isArabic ? toArabicIndic(juzNumber) : juzNumber;

  const hasReading = resultingCategories.includes('reading');
  const hasRecitation = resultingCategories.includes('recitation');

  let subtitle: string;
  if (hasReading && hasRecitation) {
    subtitle = strings.bookmark.savedSubtitleBoth(surahName, pageText, juzText);
  } else if (hasReading) {
    subtitle = strings.bookmark.savedSubtitleReading(surahName, pageText, juzText);
  } else if (hasRecitation) {
    subtitle = strings.bookmark.savedSubtitleRecitation(surahName, pageText, juzText);
  } else {
    subtitle = strings.bookmark.savedSubtitleRemoved(surahName, pageText, juzText);
  }

  return (
    <Animated.View
      entering={SlideInDown.duration(theme.motion.duration.base)}
      exiting={SlideOutDown.duration(theme.motion.duration.fast)}
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View style={styles.bookmarkTile}>
        <MaterialCommunityIcons
          name="bookmark"
          size={24}
          color={theme.semantic.accent}
        />
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.title} numberOfLines={1}>
          {undone
            ? strings.bookmark.undoneTitle
            : resultingCategories.length === 0
              ? strings.bookmark.removedTitle
              : strings.bookmark.savedTitle}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {!undone && (
        <Pressable
          onPress={onUndo}
          accessibilityRole="button"
          accessibilityLabel={strings.bookmark.undo}
          hitSlop={10}
          style={({ pressed }) => [styles.undoBtn, pressed && styles.undoBtnPressed]}
        >
          <Text style={styles.undoText}>{strings.bookmark.undo}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      bottom: 70,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.md,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: 14,
      borderTopWidth: 2,
      borderTopColor: theme.semantic.accent,
      borderRightWidth: 1,
      borderRightColor: theme.semantic.border,
      borderLeftWidth: 1,
      borderLeftColor: theme.semantic.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      ...theme.elevation.shadow2,
    },
    bookmarkTile: {
      width: 52,
      height: 52,
      borderRadius: 12,
      backgroundColor: theme.palette.gold[300] + '33',
      borderWidth: 1,
      borderColor: theme.palette.gold[300] + '88',
      alignItems: 'center',
      justifyContent: 'center',
    },
    textColumn: { flex: 1, gap: 3 },
    title: {
      fontFamily: theme.fonts.arabic,
      fontSize: 15,
      fontWeight: '600',
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    subtitle: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    undoBtn: { paddingVertical: theme.spacing.xs, paddingHorizontal: theme.spacing.xs },
    undoBtnPressed: { opacity: 0.55 },
    undoText: { fontFamily: theme.fonts.arabic, fontSize: 14, color: theme.semantic.fgMuted },
  });
}
