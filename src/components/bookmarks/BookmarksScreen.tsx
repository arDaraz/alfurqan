import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { useReadingStore } from '../../stores/readingStore';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { PillTabs } from '../home/PillTabs';
import { BookmarkRow } from './BookmarkRow';
import { getJuzAndPageForAyah, getSurahByNumber } from '../../data/quranRepository';
import { toArabicIndic } from '../../utils/arabic';
import type { Bookmark, BookmarkCategory } from '../../data/types';

interface RowData extends Bookmark {
  surahName: string;
  pageNumber: number;
}

export function BookmarksScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const bookmarks = useReadingStore((s) => s.bookmarks);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);

  const [activeTab, setActiveTab] = useState<BookmarkCategory>('reading');
  const [hydrated, setHydrated] = useState<
    Record<string, { nameArabic: string; nameEnglish: string; page: number }>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = bookmarks.filter((b) => !hydrated[`${b.surahNumber}:${b.ayahNumber}`]);
      if (missing.length === 0) return;

      const additions: Record<string, { nameArabic: string; nameEnglish: string; page: number }> = {};
      for (const b of bookmarks) {
        const key = `${b.surahNumber}:${b.ayahNumber}`;
        if (hydrated[key] || additions[key]) continue;
        try {
          const [{ page }, surah] = await Promise.all([
            getJuzAndPageForAyah(b.surahNumber, b.ayahNumber),
            getSurahByNumber(b.surahNumber),
          ]);
          if (cancelled) return;
          additions[key] = {
            nameArabic: surah?.nameArabic ?? '',
            nameEnglish: surah?.nameEnglish ?? '',
            page,
          };
        } catch {
          /* non-critical */
        }
      }
      if (!cancelled && Object.keys(additions).length > 0) {
        setHydrated((prev) => ({ ...prev, ...additions }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookmarks, hydrated]);

  const filtered: RowData[] = useMemo(() => {
    return bookmarks
      .filter((b) => b.category === activeTab)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((b) => {
        const key = `${b.surahNumber}:${b.ayahNumber}`;
        const h = hydrated[key];
        return {
          ...b,
          surahName: h ? (isArabic ? h.nameArabic : h.nameEnglish) : String(b.surahNumber),
          pageNumber: h?.page ?? 1,
        };
      });
  }, [bookmarks, activeTab, hydrated, isArabic]);

  const countReading = bookmarks.filter((b) => b.category === 'reading').length;
  const countRecitation = bookmarks.filter((b) => b.category === 'recitation').length;
  const fmtCount = (n: number) => (isArabic ? toArabicIndic(n) : String(n));

  const tabs = useMemo(
    () =>
      [
        { id: 'reading' as const, label: `${strings.bookmarks.tabReading} ${fmtCount(countReading)}` },
        {
          id: 'recitation' as const,
          label: `${strings.bookmarks.tabRecitation} ${fmtCount(countRecitation)}`,
        },
      ] as const,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [strings, countReading, countRecitation, isArabic]
  );

  const emptyCopy =
    activeTab === 'reading' ? strings.bookmarks.emptyReading : strings.bookmarks.emptyRecitation;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.back}
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.backBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="m15 6-6 6 6 6"
              stroke={theme.semantic.fg}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{strings.bookmarks.screenTitle}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.tabsWrap}>
        <PillTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </View>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(r) => `${r.surahNumber}-${r.ayahNumber}-${r.category}`}
          renderItem={({ item }) => (
            <BookmarkRow
              surahNumber={item.surahNumber}
              ayahNumber={item.ayahNumber}
              surahName={item.surahName}
              pageNumber={item.pageNumber}
              category={item.category}
              onPress={() =>
                router.push({
                  pathname: '/surah/[id]',
                  params: { id: String(item.surahNumber), page: String(item.pageNumber) },
                })
              }
              onDelete={() => removeBookmark(item.surahNumber, item.ayahNumber, item.category)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
    },
    backBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      flex: 1,
      fontFamily: theme.fonts.arabicSemiBold,
      fontSize: 18,
      color: theme.semantic.fg,
      textAlign: 'center',
    },
    tabsWrap: {
      paddingHorizontal: theme.gutter.screen,
      paddingBottom: theme.spacing.sm,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
    },
    emptyText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 14,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
  });
}
