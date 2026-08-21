import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore, type CorrectionSensitivity, type ThemeMode } from '../../stores/settingsStore';
import { isNightReadingEnabled, type ActiveNightReadingMode } from '../../constants/nightReading';
import { ReciterPickerSheet } from '../../components/quran/ReciterPickerSheet';
import { getReciterById } from '../../data/reciters';
import { useReciterStore } from '../../stores/reciterStore';

import { HomeWidgetsGroup } from '../../components/settings/HomeWidgetsGroup';
import { SettingsGroup } from '../../components/settings/SettingsGroup';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { Toggle } from '../../components/settings/Toggle';
import { Pill } from '../../components/settings/Pill';
import { FontSizeRow } from '../../components/settings/FontSizeRow';
import { NightReadingPicker } from '../../components/settings/NightReadingPicker';
import { MushafLayoutPicker } from '../../components/settings/MushafLayoutPicker';
import { InfoSheet } from '../../components/ui/InfoSheet';
import { getMushafLayout } from '../../data/mushafLayouts';

const ICON_PROPS = { width: 17, height: 17, fill: 'none', strokeWidth: 1.75 } as const;
/** Height the tab bar's floating Tasmiʿ button and its halo reach above the bar. */
const TAB_BAR_FAB_OVERHANG = 40;

export default function SettingsScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const [pickerVisible, setPickerVisible] = useState(false);
  const [mushafPickerVisible, setMushafPickerVisible] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const [aboutVisible, setAboutVisible] = useState(false);
  const appVersion = `${strings.about.version} ${Constants.expoConfig?.version ?? '1.0.0'}`;

  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';
  const styles = createStyles(theme, isArabic);

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const dailyReminder = useSettingsStore((s) => s.dailyReminder);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);
  const correctionSensitivity = useSettingsStore((s) => s.correctionSensitivity);
  const setCorrectionSensitivity = useSettingsStore((s) => s.setCorrectionSensitivity);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const quranFontScale = useSettingsStore((s) => s.quranFontScale);
  const setQuranFontScale = useSettingsStore((s) => s.setQuranFontScale);

  const selectedReciterId = useReciterStore((s) => s.selectedReciterId);
  const downloads = useReciterStore((s) => s.downloads);
  const deleteSurahDownload = useReciterStore((s) => s.deleteSurahDownload);
  const selectedReciter = getReciterById(selectedReciterId);
  const savedDownloads = Object.entries(downloads).filter(([, download]) => download.status === 'complete');
  const savedBytes = savedDownloads.reduce((total, [, download]) => total + (download.bytes ?? 0), 0);

  const mushafLayoutId = useSettingsStore((s) => s.mushafLayoutId);
  const setMushafLayoutId = useSettingsStore((s) => s.setMushafLayoutId);
  const nightReadingMode = useSettingsStore((s) => s.nightReadingMode);
  const setNightReadingMode = useSettingsStore((s) => s.setNightReadingMode);

  const selectedMushafLayout = getMushafLayout(mushafLayoutId);
  const mushafLayoutLabel = isArabic
    ? selectedMushafLayout.displayName.ar
    : selectedMushafLayout.displayName.en;
  const nightModeLabels: Record<ActiveNightReadingMode, { title: string; subtitle: string }> = {
    classical: {
      title: strings.settingsNightClassical,
      subtitle: strings.settingsNightClassicalValue,
    },
    sepia: {
      title: strings.settingsNightSepia,
      subtitle: strings.settingsNightSepiaValue,
    },
    'pure-ink': {
      title: strings.settingsNightPureInk,
      subtitle: strings.settingsNightPureInkValue,
    },
    indigo: {
      title: strings.settingsNightIndigo,
      subtitle: strings.settingsNightIndigoValue,
    },
  };
  const nightReadingEnabled = isNightReadingEnabled(nightReadingMode);
  const activeNightMode: ActiveNightReadingMode = nightReadingEnabled
    ? nightReadingMode
    : 'classical';
  const nightReadingLabel = nightReadingEnabled
    ? nightModeLabels[activeNightMode].title
    : strings.settingsNightReadingValue;

  const cycleSensitivity = () => {
    const order: CorrectionSensitivity[] = ['gentle', 'standard', 'strict'];
    const idx = order.indexOf(correctionSensitivity);
    setCorrectionSensitivity(order[(idx + 1) % order.length]);
  };

  const cycleTheme = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(themeMode);
    setThemeMode(order[(idx + 1) % order.length]);
  };

  const sensitivityLabel =
    correctionSensitivity === 'gentle'
      ? strings.settingsCorrectionGentle
      : correctionSensitivity === 'standard'
        ? strings.settingsCorrectionStandard
        : strings.settingsCorrectionStrict;

  const themeLabel =
    themeMode === 'light'
      ? strings.settingsThemeLight
      : themeMode === 'dark'
        ? strings.settingsThemeDark
        : strings.settingsThemeSystem;

  const selectedReciterLabel = isArabic ? selectedReciter.nameAr : selectedReciter.nameEn;
  const savedSummary = savedBytes > 0
    ? isArabic ? `${formatBytes(savedBytes)} محفوظة` : `${formatBytes(savedBytes)} saved`
    : strings.recitation.noneSaved;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, !isArabic && styles.titleLtr]}>{strings.settingsTitle}</Text>
        {!isArabic && <Text style={styles.romanLabel}>{strings.settingsRomanLabel}</Text>}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HomeWidgetsGroup />

        <SettingsGroup label={strings.settingsSectionReading}>
          <FontSizeRow
            label={strings.settingsQuranSize}
            value={quranFontScale}
            onChange={setQuranFontScale}
          />
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M4 7V5h16v2" stroke={theme.semantic.primary} strokeLinecap="round" />
                <Path d="M9 19h6" stroke={theme.semantic.primary} strokeLinecap="round" />
                <Path d="M12 5v14" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsMushafFont}
            value={mushafLayoutLabel}
            onPress={() => setMushafPickerVisible(true)}
            trailing={<Pill label={strings.settingsChange} />}
          />
          <SettingsRow
            isLast={!nightReadingEnabled}
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  stroke={theme.semantic.primary}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            }
            label={strings.settingsNightReading}
            value={nightReadingLabel}
            trailing={
              <Toggle
                value={nightReadingEnabled}
                onValueChange={(next) =>
                  setNightReadingMode(next ? activeNightMode : 'off')
                }
                accessibilityLabel={strings.settingsNightReading}
              />
            }
          />
          {nightReadingEnabled && (
            <NightReadingPicker
              value={activeNightMode}
              labels={nightModeLabels}
              isArabic={isArabic}
              onChange={setNightReadingMode}
            />
          )}
        </SettingsGroup>

        <SettingsGroup label={strings.settingsSectionAudio}>
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M11 5 6 9H2v6h4l5 4V5Z" stroke={theme.semantic.primary} strokeLinejoin="round" />
                <Path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsQari}
            value={`${selectedReciterLabel} · ${selectedReciter.bitrate}kbps`}
            onPress={() => setPickerVisible(true)}
            trailing={<Pill label={strings.settingsChange} />}
          />
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M12 3v11" stroke={theme.semantic.primary} strokeLinecap="round" />
                <Path d="m7 9 5 5 5-5" stroke={theme.semantic.primary} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M5 19h14" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.recitation.savedRecitations}
            value={savedSummary}
            onPress={() => setSavedVisible((visible) => !visible)}
          />
          {savedVisible && (
            <View style={styles.savedList}>
              {savedDownloads.length === 0 ? (
                <Text style={styles.emptyText}>{strings.recitation.noneSaved}</Text>
              ) : (
                savedDownloads.map(([key, download]) => {
                  const [reciterId, surah] = key.split(':');
                  return (
                    <View key={key} style={styles.savedRow}>
                      <View style={styles.savedCopy}>
                        <Text style={styles.savedTitle}>
                          {isArabic ? `${reciterId} · سورة ${surah}` : `${reciterId} · Surah ${surah}`}
                        </Text>
                        <Text style={styles.savedMeta}>{formatBytes(download.bytes ?? 0)}</Text>
                      </View>
                      <Pressable
                        onPress={() => void deleteSurahDownload(reciterId, Number(surah))}
                        accessibilityRole="button"
                        accessibilityLabel={isArabic ? `حذف سورة ${surah}` : `Delete surah ${surah}`}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteText}>{strings.recitation.delete}</Text>
                      </Pressable>
                    </View>
                  );
                })
              )}
            </View>
          )}
          <SettingsRow
            isLast
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Rect x={9} y={3} width={6} height={12} rx={3} stroke={theme.semantic.primary} />
                <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsCorrection}
            value={strings.settingsCorrection}
            trailing={
              <Pill
                label={sensitivityLabel}
                accessibilityLabel={strings.settingsCorrection}
                onPress={cycleSensitivity}
                withChevron={false}
              />
            }
          />
        </SettingsGroup>

        <SettingsGroup label={strings.settingsSectionApp}>
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Circle cx={12} cy={12} r={9} stroke={theme.semantic.primary} />
                <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsLanguage}
            value={language === 'ar' ? strings.settingsLanguageValue : strings.settingsLanguageEnValue}
            onPress={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          />
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" stroke={theme.semantic.primary} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            }
            label={strings.settingsDailyReminder}
            value={strings.settingsDailyReminderValue}
            trailing={
              <Toggle
                value={dailyReminder}
                onValueChange={setDailyReminder}
                accessibilityLabel={strings.settingsDailyReminder}
              />
            }
          />
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Circle cx={12} cy={12} r={9} stroke={theme.semantic.primary} />
                <Path d="M12 8v4M12 16h.01" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsThemeMode}
            value={themeLabel}
            onPress={cycleTheme}
          />
          <SettingsRow
            isLast
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Circle cx={12} cy={12} r={10} stroke={theme.semantic.primary} />
                <Path d="M12 8v4M12 16h.01" stroke={theme.semantic.primary} strokeLinecap="round" />
              </Svg>
            }
            label={strings.settingsAbout}
            value={appVersion}
            onPress={() => setAboutVisible(true)}
          />
        </SettingsGroup>
      </ScrollView>

      <ReciterPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} />
      <MushafLayoutPicker
        visible={mushafPickerVisible}
        value={mushafLayoutId}
        onChange={setMushafLayoutId}
        onDismiss={() => setMushafPickerVisible(false)}
      />
      <InfoSheet
        visible={aboutVisible}
        title={strings.settingsAbout}
        rows={[
          { label: strings.appTitleFull, value: appVersion, numeric: true },
          { label: strings.reader.infoMushaf, value: mushafLayoutLabel, numeric: true },
        ]}
        note={`${strings.about.credits}: ${
          isArabic ? selectedMushafLayout.attribution.ar : selectedMushafLayout.attribution.en
        }`}
        onClose={() => setAboutVisible(false)}
      />
    </SafeAreaView>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: isArabic ? 'rtl' : 'ltr',
    },
    header: {
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.fonts.quran,
      fontSize: 30,
      color: theme.semantic.fg,
      letterSpacing: 0.3,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    titleLtr: {
      fontFamily: theme.fonts.latin,
      writingDirection: 'ltr',
      fontWeight: '700',
    },
    romanLabel: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      color: theme.semantic.fgMuted,
      letterSpacing: 2.4,
      marginTop: 4,
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'ltr',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.gutter.screen - 6,
      // The tab bar's Tasmiʿ button floats above the bar and covered the last row.
      paddingBottom: 28 + TAB_BAR_FAB_OVERHANG,
    },
    savedList: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
    },
    savedRow: {
      minHeight: 56,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.semantic.border,
    },
    savedCopy: {
      flex: 1,
    },
    savedTitle: {
      color: theme.semantic.fg,
      fontFamily: theme.fonts.quran,
      fontSize: 13,
      writingDirection: 'rtl',
    },
    savedMeta: {
      color: theme.semantic.fgMuted,
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      marginTop: 2,
    },
    emptyText: {
      color: theme.semantic.fgMuted,
      fontFamily: theme.fonts.quran,
      fontSize: 13,
      paddingHorizontal: 14,
      paddingVertical: 12,
      writingDirection: 'rtl',
    },
    deleteButton: {
      minWidth: 54,
      minHeight: 32,
      borderRadius: theme.radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.semantic.dangerSoft,
      paddingHorizontal: 10,
    },
    deleteText: {
      color: theme.semantic.danger,
      fontFamily: theme.fonts.quran,
      fontSize: 12,
    },
  });
}
