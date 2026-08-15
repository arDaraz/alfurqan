import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { usePrayerTimes } from '../../hooks/usePrayerTimes';
import { useReadingStore, weekActivity } from '../../stores/readingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getMushafPageForAyah, getSurahByNumber } from '../../data/quranRepository';

import { BrandBar } from './BrandBar';
import { ContinueReadingWidget } from './widgets/ContinueReadingWidget';
import { KhatamWidget } from './widgets/KhatamWidget';
import { PrayerBand } from './widgets/PrayerBand';
import { QiblahWidget } from './widgets/QiblahWidget';
import { StreakWidget } from './widgets/StreakWidget';
import { TasmeeWidget } from './widgets/TasmeeWidget';
import { WidgetCard } from './widgets/WidgetCard';

/** Height the tab bar's floating Tasmiʿ button and its halo reach above the bar. */
const TAB_BAR_FAB_OVERHANG = 40;

/**
 * Widget-driven home. The prayer band is the day's anchor and the only
 * gradient on the screen; everything under it is a quiet tile. Which widgets
 * appear is managed from Settings › Home widgets.
 */
export function HomeView() {
  const router = useRouter();
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const mushafLayoutId = useSettingsStore((s) => s.mushafLayoutId);
  const widgets = useSettingsStore((s) => s.homeWidgets);
  const styles = createStyles(theme, isArabic);

  const lastReadSurah = useReadingStore((s) => s.lastReadSurah);
  const lastReadAyah = useReadingStore((s) => s.lastReadAyah);
  const lastReadJuz = useReadingStore((s) => s.lastReadJuz);
  const streakDays = useReadingStore((s) => s.streakDays);
  const streakLastReadDate = useReadingStore((s) => s.streakLastReadDate);
  const longestStreak = useReadingStore((s) => s.longestStreak);

  const [surahName, setSurahName] = useState<string | null>(null);
  const [pageNumber, setPageNumber] = useState<number | null>(null);

  const prayer = usePrayerTimes(widgets.prayerTimes || widgets.qiblah);

  useEffect(() => {
    if (lastReadSurah === null) {
      setSurahName(null);
      return;
    }
    let cancelled = false;
    getSurahByNumber(lastReadSurah)
      .then((surah) => {
        if (cancelled) return;
        setSurahName(surah ? (isArabic ? surah.nameArabic : surah.nameEnglish) : null);
      })
      .catch(() => {
        if (!cancelled) setSurahName(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lastReadSurah, isArabic]);

  useEffect(() => {
    if (lastReadSurah === null || lastReadAyah === null) {
      setPageNumber(null);
      return;
    }
    let cancelled = false;
    getMushafPageForAyah(mushafLayoutId, lastReadSurah, lastReadAyah)
      .then((page) => {
        if (!cancelled) setPageNumber(page);
      })
      .catch(() => {
        if (!cancelled) setPageNumber(null);
      });
    return () => {
      cancelled = true;
    };
  }, [lastReadSurah, lastReadAyah, mushafLayoutId]);

  const week = useMemo(
    () => weekActivity(streakDays, streakLastReadDate),
    [streakDays, streakLastReadDate]
  );

  const handleResume = useCallback(() => {
    if (lastReadSurah === null) {
      router.push('/surah/1');
      return;
    }
    if (lastReadAyah === null) {
      router.push(`/surah/${lastReadSurah}`);
      return;
    }
    router.push({
      pathname: '/surah/[id]',
      params: { id: String(lastReadSurah), ayah: String(lastReadAyah) },
    });
  }, [router, lastReadAyah, lastReadSurah]);

  const hasLastRead =
    lastReadSurah !== null && lastReadAyah !== null && lastReadJuz !== null && surahName !== null;

  const showQiblah = widgets.qiblah && prayer.location !== null;
  const showStreak = widgets.streak;
  const twoUp = showQiblah && showStreak;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BrandBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {widgets.prayerTimes &&
          (prayer.day !== null ? (
            <PrayerBand day={prayer.day} city={prayer.location?.city ?? null} now={prayer.now} />
          ) : (
            <WidgetCard label={strings.widgets.nextLabel}>
              <Text style={styles.notice}>
                {prayer.status === 'denied'
                  ? strings.widgets.locationDenied
                  : prayer.status === 'error'
                    ? strings.widgets.locationError
                    : strings.widgets.locating}
              </Text>
            </WidgetCard>
          ))}

        {(showQiblah || showStreak) && (
          <View style={twoUp ? styles.twoUp : undefined}>
            {showQiblah && (
              <QiblahWidget point={prayer.location!} style={twoUp ? styles.tile : undefined} />
            )}
            {showStreak && (
              <StreakWidget
                days={streakDays}
                longest={longestStreak}
                week={week}
                style={twoUp ? styles.tile : undefined}
              />
            )}
          </View>
        )}

        {widgets.continueReading &&
          (hasLastRead ? (
            <ContinueReadingWidget
              variant="resume"
              surahNumber={lastReadSurah}
              surahName={surahName}
              ayahNumber={lastReadAyah}
              juzNumber={lastReadJuz}
              pageNumber={pageNumber ?? 1}
              onPress={handleResume}
            />
          ) : (
            <ContinueReadingWidget variant="start" onPress={handleResume} />
          ))}

        {widgets.khatam && <KhatamWidget juzReached={lastReadJuz ?? 0} />}

        {widgets.tasmee && <TasmeeWidget onPress={() => router.push('/practice')} />}
      </ScrollView>
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
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.gutter.screen - 6,
      paddingTop: theme.spacing.sm,
      // The tab bar's Tasmiʿ button floats above the bar and would cover the last widget.
      paddingBottom: 28 + TAB_BAR_FAB_OVERHANG,
      gap: 12,
    },
    twoUp: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      gap: 12,
      alignItems: 'stretch',
    },
    tile: {
      flex: 1,
    },
    notice: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 13,
      lineHeight: isArabic ? 24 : 18,
      color: theme.semantic.fgMuted,
      marginTop: 8,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
