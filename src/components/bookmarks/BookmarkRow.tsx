import React, { useEffect, useRef, useState } from 'react';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { toArabicIndic } from '../../utils/arabic';
import { getAyahPreview } from '../../data/quranRepository';
import type { BookmarkCategory } from '../../data/types';

interface Props {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  pageNumber: number;
  category: BookmarkCategory;
  onPress: () => void;
  onDelete: () => void;
}

export function BookmarkRow({
  surahNumber,
  ayahNumber,
  surahName,
  pageNumber,
  onPress,
  onDelete,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const [preview, setPreview] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void getAyahPreview(surahNumber, ayahNumber).then((text) => {
      if (mounted.current) setPreview(text);
    });
    return () => {
      mounted.current = false;
    };
  }, [surahNumber, ayahNumber]);

  const ayahLabel = isArabic ? toArabicIndic(ayahNumber) : ayahNumber;
  const pageLabel = isArabic ? toArabicIndic(pageNumber) : pageNumber;

  const renderDeleteAction = () => (
    <RectButton
      accessibilityLabel={`delete-${surahNumber}-${ayahNumber}`}
      onPress={onDelete}
      style={styles.deleteAction}
    >
      <Text style={styles.deleteText}>{strings.bookmarks.deleteAction}</Text>
    </RectButton>
  );

  const actionProps = I18nManager.isRTL
    ? { renderLeftActions: renderDeleteAction, overshootLeft: false }
    : { renderRightActions: renderDeleteAction, overshootRight: false };

  return (
    <Swipeable {...actionProps}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`bookmark-row-${surahNumber}-${ayahNumber}`}
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={1}>
            {`${surahName} · ${strings.searchAyahLabel} ${ayahLabel}`}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {`${strings.searchPageShort} ${pageLabel}`}
          </Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </Pressable>
    </Swipeable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      backgroundColor: theme.semantic.bgRaised,
      paddingVertical: theme.spacing.md - 2,
      paddingHorizontal: theme.gutter.row,
      borderBottomWidth: 1,
      borderBottomColor: theme.semantic.border,
      gap: 6,
    },
    rowPressed: { backgroundColor: theme.semantic.bgSunken },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: {
      flex: 1,
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 15,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    meta: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fgMuted,
    },
    preview: {
      fontFamily: theme.fonts.quran,
      fontSize: 16,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    deleteAction: {
      backgroundColor: theme.semantic.danger,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    deleteText: {
      color: theme.semantic.fgOnPrimary,
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
