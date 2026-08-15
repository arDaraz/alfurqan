import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Svg, { Path, Circle } from 'react-native-svg';
import { useReadingStore } from '../../stores/readingStore';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';
import { PillTabs } from '../home/PillTabs';
import { BookmarkRow } from './BookmarkRow';
import { getMushafJuzAndPageForAyah, getSurahByNumber } from '../../data/quranRepository';
import { toArabicIndic } from '../../utils/arabic';
import type { Bookmark, BookmarkCategory } from '../../data/types';

interface RowData extends Bookmark {
  surahName: string;
  pageNumber: number;
  juzNumber: number;
}

export function BookmarksScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const router = useRouter();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const layoutId = useSettingsStore((s) => s.mushafLayoutId);
  const styles = createStyles(theme, isArabic);
  const params = useLocalSearchParams<{ tab?: string }>();

  const bookmarks = useReadingStore((s) => s.bookmarks);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);

  const initialTab: BookmarkCategory = params.tab === 'reading' ? 'reading' : 'recitation';
  const [activeTab, setActiveTab] = useState<BookmarkCategory>(initialTab);
  const [newestFirst, setNewestFirst] = useState(true);
  const [hydrated, setHydrated] = useState<
    Record<string, { nameArabic: string; nameEnglish: string; page: number; juz: number }>
  >({});

  const hydratedRef = useRef<typeof hydrated>(hydrated);
  useEffect(() => {
    hydratedRef.current = hydrated;
  }, [hydrated]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const missing = bookmarks.filter(
        (b) => !hydratedRef.current[`${layoutId}:${b.surahNumber}:${b.ayahNumber}`]
      );
      if (missing.length === 0) return;

      const additions: Record<
        string,
        { nameArabic: string; nameEnglish: string; page: number; juz: number }
      > = {};
      for (const b of bookmarks) {
        const key = `${layoutId}:${b.surahNumber}:${b.ayahNumber}`;
        if (hydratedRef.current[key] || additions[key]) continue;
        try {
          const [{ page, juz }, surah] = await Promise.all([
            getMushafJuzAndPageForAyah(layoutId, b.surahNumber, b.ayahNumber),
            getSurahByNumber(b.surahNumber),
          ]);
          if (cancelled) return;
          additions[key] = {
            nameArabic: surah?.nameArabic ?? '',
            nameEnglish: surah?.nameEnglish ?? '',
            page,
            juz,
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
  }, [bookmarks, layoutId]);

  const filtered: RowData[] = useMemo(() => {
    return bookmarks
      .filter((b) => b.category === activeTab)
      .sort((a, b) => (newestFirst ? b.createdAt - a.createdAt : a.createdAt - b.createdAt))
      .map((b) => {
        const key = `${layoutId}:${b.surahNumber}:${b.ayahNumber}`;
        const h = hydrated[key];
        return {
          ...b,
          surahName: h ? (isArabic ? h.nameArabic : h.nameEnglish) : String(b.surahNumber),
          pageNumber: h?.page ?? 1,
          juzNumber: h?.juz ?? 1,
        };
      });
  }, [bookmarks, activeTab, hydrated, isArabic, layoutId, newestFirst]);

  const countReading = bookmarks.filter((b) => b.category === 'reading').length;
  const countRecitation = bookmarks.filter((b) => b.category === 'recitation').length;
  const fmtCount = (n: number) => (isArabic ? toArabicIndic(n) : String(n));

  // RTL order: first item in array renders on the physical right.
  // Design has "الحفظ" (recitation) on the right and active by default → list it first.
  const tabs = useMemo(
    () =>
      [
        {
          id: 'recitation' as const,
          label: strings.bookmarks.tabRecitation,
          count: fmtCount(countRecitation),
        },
        {
          id: 'reading' as const,
          label: strings.bookmarks.tabReading,
          count: fmtCount(countReading),
        },
      ] as const,
    [strings, countReading, countRecitation, isArabic] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const emptyCopy =
    activeTab === 'reading' ? strings.bookmarks.emptyReading : strings.bookmarks.emptyRecitation;
  const sortLabel = newestFirst ? strings.bookmarks.sortNewest : strings.bookmarks.sortOldest;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.bookmarks.moreMenuLabel}
          accessibilityValue={{ text: sortLabel }}
          onPress={() => setNewestFirst((newest) => !newest)}
          hitSlop={8}
          style={styles.iconBtn}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={5} r={1.6} fill={theme.semantic.fg} />
            <Circle cx={12} cy={12} r={1.6} fill={theme.semantic.fg} />
            <Circle cx={12} cy={19} r={1.6} fill={theme.semantic.fg} />
          </Svg>
        </Pressable>
        <Text style={styles.title}>{strings.bookmarks.screenTitle}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={strings.back}
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.iconBtn}
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
      </View>

      <View style={styles.tabsWrap}>
        <PillTabs tabs={tabs} active={activeTab} onChange={setActiveTab} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={sortLabel}
        onPress={() => setNewestFirst((newest) => !newest)}
        style={styles.sortRow}
      >
        <Text style={styles.sortLabel}>{sortLabel}</Text>
      </Pressable>

      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyCopy}</Text>
        </View>
      ) : (
        <FlashList
          data={filtered}
          contentContainerStyle={styles.listContent}
          keyExtractor={(r) => `${r.surahNumber}-${r.ayahNumber}-${r.category}`}
          renderItem={({ item }) => (
            <BookmarkRow
              surahNumber={item.surahNumber}
              ayahNumber={item.ayahNumber}
              surahName={item.surahName}
              pageNumber={item.pageNumber}
              juzNumber={item.juzNumber}
              category={item.category}
              createdAt={item.createdAt}
              onPress={() =>
                router.push({
                  pathname: '/surah/[id]',
                  params: { id: String(item.surahNumber), ayah: String(item.ayahNumber) },
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
    iconBtn: {
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
    sortRow: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
      marginBottom: theme.spacing.md,
    },
    sortLabel: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.accent,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
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
