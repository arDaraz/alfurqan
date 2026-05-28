import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import type { Theme } from '../../constants/theme';
import type { BookmarkCategory } from '../../data/types';

export interface BookmarkCommit {
  previous: BookmarkCategory[];
  next: BookmarkCategory[];
  added: BookmarkCategory[];
  removed: BookmarkCategory[];
}

interface Props {
  surahName: string;
  ayahNumber: number;
  initialCategories: BookmarkCategory[];
  onCommit: (commit: BookmarkCommit) => void;
  onDismiss: () => void;
}

const CATEGORIES: BookmarkCategory[] = ['reading', 'recitation'];

export function BookmarkCategorySheet({
  surahName,
  ayahNumber,
  initialCategories,
  onCommit,
  onDismiss,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const previous = useMemo(() => sortCats(initialCategories), [initialCategories]);
  const [selected, setSelected] = useState<Set<BookmarkCategory>>(new Set(previous));

  const handleToggle = (c: BookmarkCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const buildCommit = (next: BookmarkCategory[]): BookmarkCommit => {
    const prevSet = new Set(previous);
    const nextSet = new Set(next);
    return {
      previous,
      next,
      added: next.filter((c) => !prevSet.has(c)),
      removed: previous.filter((c) => !nextSet.has(c)),
    };
  };

  const handleSave = () => {
    const next = sortCats(Array.from(selected));
    onCommit(buildCommit(next));
  };

  const handleRemoveAll = () => {
    onCommit(buildCommit([]));
  };

  const ayahLabel = isArabic ? toArabicIndic(ayahNumber) : ayahNumber;
  const showRemoveAll = previous.length > 0;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View
        entering={FadeIn.duration(theme.motion.duration.fast)}
        exiting={FadeOut.duration(theme.motion.duration.fast)}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityLabel="sheet-backdrop"
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(theme.motion.duration.base)}
        exiting={SlideOutDown.duration(theme.motion.duration.fast)}
        style={styles.sheet}
        accessibilityRole="alert"
      >
        <Text style={styles.title}>{strings.bookmarks.sheetTitle}</Text>
        <Text style={styles.subtitle}>{`${surahName} · ${strings.searchAyahLabel} ${ayahLabel}`}</Text>

        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => {
            const isOn = selected.has(c);
            const label =
              c === 'reading' ? strings.bookmarks.categoryReading : strings.bookmarks.categoryRecitation;
            return (
              <Pressable
                key={c}
                accessibilityRole="checkbox"
                accessibilityLabel={`chip-${c}`}
                accessibilityState={{ selected: isOn }}
                onPress={() => handleToggle(c)}
                style={[styles.chip, isOn && styles.chipOn]}
              >
                <Text style={[styles.chipLabel, isOn && styles.chipLabelOn]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.actions}>
          {showRemoveAll && (
            <Pressable
              accessibilityRole="button"
              onPress={handleRemoveAll}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.removeBtnPressed]}
            >
              <Text style={styles.removeText}>{strings.bookmarks.sheetRemoveAll}</Text>
            </Pressable>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={handleSave}
            style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
          >
            <Text style={styles.saveText}>{strings.bookmarks.sheetSave}</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function sortCats(cats: BookmarkCategory[]): BookmarkCategory[] {
  return [...new Set(cats)].sort();
}

function createStyles(theme: Theme, isArabic: boolean) {
  return StyleSheet.create({
    root: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.32)',
    },
    sheet: {
      position: 'absolute',
      left: theme.spacing.md,
      right: theme.spacing.md,
      bottom: 70,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.md,
      borderTopWidth: 2,
      borderTopColor: theme.semantic.accent,
      borderRightWidth: 1,
      borderRightColor: theme.semantic.border,
      borderLeftWidth: 1,
      borderLeftColor: theme.semantic.border,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      ...theme.elevation.shadow3,
    },
    title: {
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    subtitle: {
      fontFamily: theme.fonts.arabic,
      fontSize: 13,
      color: theme.semantic.fgMuted,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    chipRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
      alignItems: 'center',
    },
    chipOn: {
      backgroundColor: theme.semantic.primary,
      borderColor: theme.semantic.primary,
    },
    chipLabel: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fg,
    },
    chipLabelOn: { color: theme.semantic.fgOnPrimary },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: theme.spacing.xs,
    },
    removeBtn: { paddingVertical: 10, paddingHorizontal: 12 },
    removeBtnPressed: { opacity: 0.55 },
    removeText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.danger,
    },
    saveBtn: {
      paddingVertical: 10,
      paddingHorizontal: 22,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.primary,
      marginLeft: 'auto',
    },
    saveBtnPressed: { backgroundColor: theme.semantic.primaryPressed },
    saveText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fgOnPrimary,
      fontWeight: '600',
    },
  });
}
