import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { PRAYER_METHODS, type PrayerMethodId } from '../../services/prayerTimes';
import { useSettingsStore, type HomeWidgetId } from '../../stores/settingsStore';

import { Pill } from './Pill';
import { SettingsGroup } from './SettingsGroup';
import { SettingsRow } from './SettingsRow';
import { Toggle } from './Toggle';

const ICON_PROPS = { width: 17, height: 17, fill: 'none', strokeWidth: 1.75 } as const;

const METHOD_IDS = Object.keys(PRAYER_METHODS) as PrayerMethodId[];

/** Human names for adhan's calculation methods, same in both languages. */
const METHOD_LABELS: Record<PrayerMethodId, string> = {
  UmmAlQura: 'Umm al-Qura',
  MuslimWorldLeague: 'Muslim World League',
  Egyptian: 'Egyptian General Authority',
  Karachi: 'University of Karachi',
  Dubai: 'Dubai',
  Qatar: 'Qatar',
  Kuwait: 'Kuwait',
  Singapore: 'Singapore',
  Turkey: 'Diyanet (Turkey)',
  NorthAmerica: 'ISNA (North America)',
};

/**
 * Settings › Home widgets. One place turns each widget on or off and carries
 * its options, so Home itself stays inert and a long press can never rearrange
 * the page by accident.
 */
export function HomeWidgetsGroup() {
  const theme = useTheme();
  const strings = useStrings();
  const copy = strings.settingsHome;

  const widgets = useSettingsStore((s) => s.homeWidgets);
  const setHomeWidget = useSettingsStore((s) => s.setHomeWidget);
  const prayerMethod = useSettingsStore((s) => s.prayerMethod);
  const setPrayerMethod = useSettingsStore((s) => s.setPrayerMethod);
  const prayerMadhab = useSettingsStore((s) => s.prayerMadhab);
  const setPrayerMadhab = useSettingsStore((s) => s.setPrayerMadhab);
  const location = useSettingsStore((s) => s.prayerLocation);

  const stroke = theme.semantic.primary;
  const toggleFor = (id: HomeWidgetId, label: string) => (
    <Toggle
      value={widgets[id]}
      onValueChange={(next) => setHomeWidget(id, next)}
      accessibilityLabel={label}
    />
  );

  const cycleMethod = () => {
    const index = METHOD_IDS.indexOf(prayerMethod);
    setPrayerMethod(METHOD_IDS[(index + 1) % METHOD_IDS.length]);
  };

  const prayerValue = widgets.prayerTimes
    ? `${METHOD_LABELS[prayerMethod]} · ${location?.city ?? copy.noLocation}`
    : copy.prayerTimesOff;

  return (
    <SettingsGroup label={strings.settingsSectionHome}>
      <SettingsRow
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <Circle cx={12} cy={12} r={9} stroke={stroke} />
            <Path d="M12 7v5l3 2" stroke={stroke} strokeLinecap="round" />
          </Svg>
        }
        label={copy.prayerTimes}
        value={prayerValue}
        trailing={toggleFor('prayerTimes', copy.prayerTimes)}
      />
      {widgets.prayerTimes && (
        <>
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M4 19h16" stroke={stroke} strokeLinecap="round" />
                <Path d="M7 19V9M12 19V5M17 19v-6" stroke={stroke} strokeLinecap="round" />
              </Svg>
            }
            label={copy.method}
            value={METHOD_LABELS[prayerMethod]}
            onPress={cycleMethod}
            trailing={<Pill label={strings.settingsChange} />}
          />
          <SettingsRow
            icon={
              <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
                <Path d="M12 3v18" stroke={stroke} strokeLinecap="round" />
                <Path d="M5 8h14" stroke={stroke} strokeLinecap="round" />
              </Svg>
            }
            label={copy.madhab}
            value={prayerMadhab === 'hanafi' ? copy.madhabHanafi : copy.madhabShafi}
            trailing={
              <Pill
                label={prayerMadhab === 'hanafi' ? copy.madhabHanafi : copy.madhabShafi}
                accessibilityLabel={copy.madhab}
                onPress={() => setPrayerMadhab(prayerMadhab === 'hanafi' ? 'shafi' : 'hanafi')}
                withChevron={false}
              />
            }
          />
        </>
      )}
      <SettingsRow
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <Circle cx={12} cy={12} r={9} stroke={stroke} />
            <Path d="M12 4v3" stroke={stroke} strokeLinecap="round" />
            <Path d="M12 12 16 8" stroke={stroke} strokeLinecap="round" />
          </Svg>
        }
        label={copy.qiblah}
        value={copy.qiblahValue}
        trailing={toggleFor('qiblah', copy.qiblah)}
      />
      <SettingsRow
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <Path d="M6 4h12v17l-6-4-6 4z" stroke={stroke} strokeLinejoin="round" />
          </Svg>
        }
        label={copy.continueReading}
        value={copy.continueReadingValue}
        trailing={toggleFor('continueReading', copy.continueReading)}
      />
      <SettingsRow
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <Path d="M4 19h16" stroke={stroke} strokeLinecap="round" />
            <Path d="M7 19V9M12 19V5M17 19v-6" stroke={stroke} strokeLinecap="round" />
          </Svg>
        }
        label={copy.streak}
        value={copy.streakValue}
        trailing={toggleFor('streak', copy.streak)}
      />
      <SettingsRow
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <G transform="translate(12 12)" stroke={stroke} fill="none">
              <Rect x={-7} y={-7} width={14} height={14} />
              <Rect x={-7} y={-7} width={14} height={14} transform="rotate(45)" />
            </G>
          </Svg>
        }
        label={copy.khatam}
        value={copy.khatamValue}
        trailing={toggleFor('khatam', copy.khatam)}
      />
      <SettingsRow
        isLast
        icon={
          <Svg viewBox="0 0 24 24" {...ICON_PROPS}>
            <Rect x={9} y={3} width={6} height={12} rx={3} stroke={stroke} />
            <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={stroke} strokeLinecap="round" />
          </Svg>
        }
        label={copy.tasmee}
        value={widgets.tasmee ? copy.tasmeeValue : copy.tasmeeOff}
        trailing={toggleFor('tasmee', copy.tasmee)}
      />
    </SettingsGroup>
  );
}
