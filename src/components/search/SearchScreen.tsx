import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSurahList } from '../../hooks/useSurahList';
import { searchAyahs, getSurahByNumber, type AyahSearchResult } from '../../data/quranRepository';
import { toArabicIndic } from '../../utils/arabic';
import { OrnamentDivider } from '../brand/OrnamentDivider';
import { handleAyahAction } from '../../actions/ayahActions';
import { recitationEngine } from '../../services/recitationEngine';
import { useRecitationStore } from '../../stores/recitationStore';
import { useReadingStore } from '../../stores/readingStore';
import type { Surah, AyahSelection } from '../../data/types';
import { BookmarkCategorySheet, type BookmarkCommit } from '../quran/BookmarkCategorySheet';

import { SearchInput } from './SearchInput';
import { AyahResultRow } from './AyahResultRow';
import { SurahBrowser } from './SurahBrowser';

const DEBOUNCE_MS = 300;

type Status = 'idle' | 'loading' | 'ready' | 'error';

interface SearchScreenProps {
  initialQuery?: string;
}

export function SearchScreen({ initialQuery = '' }: SearchScreenProps) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const mushafLayoutId = useSettingsStore((s) => s.mushafLayoutId);
  const styles = createStyles(theme, isArabic);

  const { surahs } = useSurahList();
  const surahByNumber = useMemo(() => {
    const m = new Map<number, Surah>();
    for (const s of surahs) m.set(s.number, s);
    return m;
  }, [surahs]);

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [results, setResults] = useState<AyahSearchResult[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const requestId = useRef(0);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    return () => {
      if (useRecitationStore.getState().state !== 'idle') {
        recitationEngine.stop().catch((err) => console.warn('stop on unmount failed', err));
      }
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setResults([]);
      setStatus('idle');
      if (useRecitationStore.getState().state !== 'idle') {
        recitationEngine.stop().catch((err) => console.warn('stop on clear failed', err));
      }
      return;
    }
    const id = ++requestId.current;
    setStatus('loading');
    searchAyahs(trimmed, undefined, mushafLayoutId)
      .then((r) => {
        if (id !== requestId.current) return;
        setResults(r);
        setStatus('ready');
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        console.warn('searchAyahs failed', err);
        setResults([]);
        setStatus('error');
      });
  }, [debouncedQuery, mushafLayoutId]);

  const totalCount = results.length;
  const totalDigits = isArabic ? toArabicIndic(totalCount) : String(totalCount);
  const showHeaderCount = status === 'ready' && totalCount > 0;

  const addBookmark = useReadingStore((s) => s.addBookmark);
  const removeBookmark = useReadingStore((s) => s.removeBookmark);
  const getBookmarkCategories = useReadingStore((s) => s.getBookmarkCategories);

  const [sheetSelection, setSheetSelection] = useState<AyahSelection | null>(null);
  const [sheetSurahName, setSheetSurahName] = useState('');

  const openSheet = useCallback(async (selection: AyahSelection) => {
    setSheetSelection(selection);
    try {
      const s = await getSurahByNumber(selection.startSurah);
      setSheetSurahName(isArabic ? s?.nameArabic ?? '' : s?.nameEnglish ?? '');
    } catch {
      setSheetSurahName('');
    }
  }, [isArabic]);

  const handleSheetCommit = useCallback((commit: BookmarkCommit) => {
    if (!sheetSelection) return;
    const { startSurah, startAyah } = sheetSelection;
    commit.added.forEach((c) => addBookmark(startSurah, startAyah, c));
    commit.removed.forEach((c) => removeBookmark(startSurah, startAyah, c));
    setSheetSelection(null);
  }, [sheetSelection, addBookmark, removeBookmark]);

  const handleSheetDismiss = useCallback(() => setSheetSelection(null), []);

  const selectionFor = useCallback(
    (r: AyahSearchResult) => ({
      startSurah: r.surahNumber,
      startAyah: r.ayahNumber,
      endSurah: r.surahNumber,
      endAyah: r.ayahNumber,
    }),
    [],
  );

  const handleOpen = useCallback((r: AyahSearchResult) => {
    router.push(`/surah/${r.surahNumber}?ayah=${r.ayahNumber}`);
  }, []);

  const handlePlay = useCallback((r: AyahSearchResult) => {
    const snapshot = useRecitationStore.getState();
    const isThisAyah =
      snapshot.range?.surah === r.surahNumber &&
      snapshot.range?.startAyah === r.ayahNumber;

    if (isThisAyah && snapshot.state === 'playing') {
      recitationEngine.pause().catch((err) => console.warn('pause failed', err));
      return;
    }
    if (isThisAyah && snapshot.state === 'paused') {
      recitationEngine.resume().catch((err) => console.warn('resume failed', err));
      return;
    }

    (async () => {
      try {
        if (snapshot.state !== 'idle') {
          await recitationEngine.stop();
        }
        await recitationEngine.start({
          surah: r.surahNumber,
          startAyah: r.ayahNumber,
          stopAyah: r.ayahNumber,
          trigger: 'popup',
          selectedEndSurah: r.surahNumber,
          selectedEndAyah: r.ayahNumber,
        });
      } catch (err) {
        console.warn('play failed', err);
      }
    })();
  }, []);

  const handleCopy = useCallback(
    (r: AyahSearchResult) => {
      handleAyahAction('copy', selectionFor(r), undefined).catch((err) => {
        console.warn('copy failed', err);
      });
    },
    [selectionFor],
  );

  const handleBookmark = useCallback(
    (r: AyahSearchResult) => {
      handleAyahAction('bookmark', selectionFor(r), {
        onRequestBookmark: (sel) => {
          void openSheet(sel);
        },
      }).catch((err) => {
        console.warn('bookmark failed', err);
      });
    },
    [selectionFor, openSheet],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={styles.title}
            accessibilityRole="header"
            allowFontScaling
            numberOfLines={1}
          >
            {strings.tabSearch}
          </Text>
          {showHeaderCount && (
            <View
              style={styles.countLine}
              accessible
              accessibilityLiveRegion="polite"
              accessibilityLabel={`${totalDigits} ${strings.searchInQuran}`}
            >
              <Text style={styles.countNumber} allowFontScaling>{totalDigits}</Text>
              <Text style={styles.countLabel} allowFontScaling numberOfLines={1}>
                {strings.searchInQuran}
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.inputWrap}>
        {/* No autoFocus: the idle state is the surah browser, and a keyboard would cover it. */}
        <SearchInput value={query} onChangeText={setQuery} />
      </View>

      {status === 'idle' && <SurahBrowser />}

      {status === 'loading' && (
        <View
          style={styles.center}
          accessible
          accessibilityLiveRegion="polite"
          accessibilityLabel={strings.searchSearchingAria}
        >
          <ActivityIndicator color={theme.semantic.primary} size="large" />
          <Text style={styles.searchingText} allowFontScaling>
            {strings.searchSearchingAria}
          </Text>
        </View>
      )}

      {status === 'ready' && totalCount === 0 && (
        <View style={styles.center}>
          <OrnamentDivider tier="compact" />
          <Text style={styles.emptyTitle} allowFontScaling>
            {strings.searchNoResults}
          </Text>
          <Text style={styles.idleHint} allowFontScaling>
            {strings.searchHint}
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={styles.center} accessibilityLiveRegion="polite">
          <Text style={[styles.emptyTitle, styles.errorTitle]} allowFontScaling>
            {strings.searchError}
          </Text>
          <Text style={styles.idleHint} allowFontScaling>
            {strings.searchHint}
          </Text>
        </View>
      )}

      {status === 'ready' && totalCount > 0 && (
        <FlashList
          data={results}
          keyExtractor={(r) => `${r.surahNumber}:${r.ayahNumber}`}
          contentContainerStyle={styles.listContent}
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => {
            const s = surahByNumber.get(item.surahNumber);
            return (
              <AyahResultRow
                result={item}
                query={debouncedQuery}
                surahNameArabic={s?.nameArabic ?? String(item.surahNumber)}
                surahNameEnglish={s?.nameEnglish ?? String(item.surahNumber)}
                onPress={handleOpen}
                onPlay={handlePlay}
                onCopy={handleCopy}
                onBookmark={handleBookmark}
              />
            );
          }}
        />
      )}

      {sheetSelection && (
        <BookmarkCategorySheet
          surahName={sheetSurahName}
          ayahNumber={sheetSelection.startAyah}
          initialCategories={getBookmarkCategories(sheetSelection.startSurah, sheetSelection.startAyah)}
          onCommit={handleSheetCommit}
          onDismiss={handleSheetDismiss}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  const arabicText = { textAlign: 'left' as const, writingDirection: 'rtl' as const };
  const ltrText = { textAlign: 'left' as const, writingDirection: 'ltr' as const };

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bgSunken,
    },
    header: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.xs,
      paddingBottom: theme.spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: isArabic ? theme.typeScale.heading.size + 4 : theme.typeScale.heading.size,
      lineHeight:
        (isArabic ? theme.typeScale.heading.size + 4 : theme.typeScale.heading.size) *
        theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      fontWeight: '700',
      ...(isArabic ? arabicText : ltrText),
      flexShrink: 1,
    },
    countLine: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
      paddingBottom: 4,
      flexShrink: 1,
    },
    countNumber: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.label.size,
      lineHeight: theme.typeScale.label.size * 1.3,
      color: theme.semantic.accent,
      fontWeight: '700',
      ...ltrText,
      includeFontPadding: false,
    },
    countLabel: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.label.size,
      lineHeight: theme.typeScale.label.size * 1.3,
      color: theme.semantic.accent,
      fontWeight: '500',
      ...(isArabic ? arabicText : ltrText),
      includeFontPadding: false,
      flexShrink: 1,
    },
    inputWrap: {
      paddingBottom: theme.spacing.md - 4,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
      gap: theme.spacing.md,
      paddingBottom: theme.spacing['2xl'],
    },
    idleHint: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * theme.typeScale.body.lineHeight,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
    searchingText: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size - 2,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
    },
    emptyTitle: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.title.size + 2,
      lineHeight: (theme.typeScale.title.size + 2) * theme.typeScale.title.lineHeight,
      color: theme.semantic.fg,
      fontWeight: '700',
      textAlign: 'center',
    },
    errorTitle: {
      color: theme.semantic.danger,
    },
    listContent: {
      paddingBottom: theme.spacing['4xl'],
      paddingTop: 4,
    },
  });
}
