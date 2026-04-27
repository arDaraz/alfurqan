import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore, type CorrectionSensitivity, type ThemeMode, type MushafFont } from '../../stores/settingsStore';
import { isNightReadingEnabled, type ActiveNightReadingMode } from '../../constants/nightReading';
import { useReadingStore } from '../../stores/readingStore';

import { ProfileCard } from '../../components/settings/ProfileCard';
import { SettingsGroup } from '../../components/settings/SettingsGroup';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { Toggle } from '../../components/settings/Toggle';
import { Pill } from '../../components/settings/Pill';
import { FontSizeRow } from '../../components/settings/FontSizeRow';
import { NightReadingPicker } from '../../components/settings/NightReadingPicker';

const ICON_PROPS = { width: 17, height: 17, fill: 'none', strokeWidth: 1.75 } as const;

const SETTINGS_PROFILE_NAME = 'أبو يوسف';
const SETTINGS_STREAK = 27;

export default function SettingsScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';

  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const showTashkeel = useSettingsStore((s) => s.showTashkeel);
  const setShowTashkeel = useSettingsStore((s) => s.setShowTashkeel);
  const dailyReminder = useSettingsStore((s) => s.dailyReminder);
  const setDailyReminder = useSettingsStore((s) => s.setDailyReminder);
  const correctionSensitivity = useSettingsStore((s) => s.correctionSensitivity);
  const setCorrectionSensitivity = useSettingsStore((s) => s.setCorrectionSensitivity);
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const quranFontScale = useSettingsStore((s) => s.quranFontScale);
  const setQuranFontScale = useSettingsStore((s) => s.setQuranFontScale);

  const lastReadPage = useReadingStore((s) => s.lastReadPage) ?? 14;
  const lastReadJuz = Math.max(1, Math.min(30, Math.ceil(lastReadPage / (604 / 30))));

  const mushafFont = useSettingsStore((s) => s.mushafFont);
  const setMushafFont = useSettingsStore((s) => s.setMushafFont);
  const nightReadingMode = useSettingsStore((s) => s.nightReadingMode);
  const setNightReadingMode = useSettingsStore((s) => s.setNightReadingMode);

  const mushafFontLabels: Record<MushafFont, string> = {
    uthmanic: 'Uthmanic Naskh',
    'qcf-v1': 'QCF/QPC V1',
    'qcf-v4': 'QCF/QPC V4 Tajweed',
    'indopak-nastaleeq': 'IndoPak Nastaleeq',
    'digital-khatt-indopak': 'Digital Khatt IndoPak',
  };

  const activeMushafFont: MushafFont = mushafFont in mushafFontLabels ? mushafFont : 'uthmanic';

  const cycleMushafFont = () => {
    const order: MushafFont[] = ['uthmanic', 'qcf-v1', 'qcf-v4', 'indopak-nastaleeq', 'digital-khatt-indopak'];
    const idx = order.indexOf(activeMushafFont);
    setMushafFont(order[(idx + 1) % order.length]);
  };

  const mushafFontLabel = mushafFontLabels[activeMushafFont];
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
        <ProfileCard
          name={SETTINGS_PROFILE_NAME}
          juzNumber={lastReadJuz}
          pageNumber={lastReadPage}
          streakDays={SETTINGS_STREAK}
        />

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
            value={mushafFontLabel}
            trailing={<Pill label={strings.settingsChange} onPress={cycleMushafFont} />}
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
            value={strings.settingsQariValue}
            trailing={<Pill label={strings.settingsChange} />}
          />
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
            trailing={<Pill label={sensitivityLabel} onPress={cycleSensitivity} withChevron={false} />}
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
            value={strings.settingsAbout}
          />
        </SettingsGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.semantic.bg,
      direction: 'rtl',
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
      paddingBottom: 28,
    },
  });
}
