import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Stop, RadialGradient as SvgRadialGradient } from 'react-native-svg';

import { useStrings } from '../../../constants/strings';
import { useTheme } from '../../../hooks/useTheme';
import { useSettingsStore } from '../../../stores/settingsStore';
import { PRAYER_ORDER, minutesUntil, type PrayerDay, type PrayerName } from '../../../services/prayerTimes';
import { formatClock, formatCountdown } from '../../../utils/clock';

interface Props {
  day: PrayerDay;
  city: string | null;
  now: Date;
}

/**
 * The day's anchor: next prayer name and time over the Sajjada Teal gradient,
 * with the five-prayer strip inside the same band. Exactly one widget per
 * screen wears this treatment.
 */
export function PrayerBand({ day, city, now }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const clock = formatClock(day.next.at, isArabic);
  const countdown = formatCountdown(minutesUntil(day.next.at, now), isArabic);

  return (
    <LinearGradient
      colors={[theme.palette.teal[700], theme.palette.teal[500], theme.palette.teal[500]]}
      locations={[0, 0.55, 1]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.band}
    >
      <Svg style={styles.glow} width={180} height={180} viewBox="0 0 180 180" pointerEvents="none">
        <Defs>
          <SvgRadialGradient id="prayerGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={theme.semantic.accentSoft} stopOpacity={0.18} />
            <Stop offset="60%" stopColor={theme.semantic.accentSoft} stopOpacity={0} />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={90} cy={90} r={90} fill="url(#prayerGlow)" />
      </Svg>

      <View style={styles.headerRow}>
        <Text style={styles.overline}>{strings.widgets.nextLabel}</Text>
        {city !== null && <Text style={styles.city}>{city}</Text>}
      </View>

      <View style={styles.nameRow}>
        <Text style={styles.name}>{strings.widgets.names[day.next.name]}</Text>
        <Text style={styles.time}>
          {clock.time}
          {clock.meridiem !== '' && <Text style={styles.meridiem}>{` ${clock.meridiem}`}</Text>}
        </Text>
      </View>

      <Text style={styles.countdown}>
        {strings.widgets.countdown(countdown.hoursText, countdown.minutesText, countdown.hours)}
      </Text>

      <View style={styles.divider} />

      <View style={styles.strip}>
        {PRAYER_ORDER.map((prayer) => (
          <StripCell
            key={prayer}
            prayer={prayer}
            at={day.times[prayer]}
            isNext={prayer === day.next.name}
            isArabic={isArabic}
            styles={styles}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

function StripCell({
  prayer,
  at,
  isNext,
  isArabic,
  styles,
}: {
  prayer: PrayerName;
  at: Date;
  isNext: boolean;
  isArabic: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const strings = useStrings();
  const clock = formatClock(at, isArabic);
  return (
    <View style={[styles.stripCell, isNext && styles.stripCellActive]}>
      <Text style={[styles.stripName, isNext && styles.stripActiveText]} numberOfLines={1}>
        {strings.widgets.names[prayer]}
      </Text>
      <Text style={[styles.stripTime, isNext && styles.stripActiveText]} numberOfLines={1}>
        {clock.time}
      </Text>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  const paper = theme.palette.paper[50];
  return StyleSheet.create({
    band: {
      direction: isArabic ? 'rtl' : 'ltr',
      borderRadius: theme.radii.lg,
      padding: isArabic ? 16 : 20,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -30,
      ...(isArabic ? { right: -30 } : { left: -30 }),
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: 12,
    },
    overline: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 10,
      lineHeight: isArabic ? 22 : 13,
      letterSpacing: isArabic ? 0 : 2.2,
      fontWeight: isArabic ? 'normal' : '700',
      textTransform: isArabic ? 'none' : 'uppercase',
      color: theme.semantic.accentSoft,
      opacity: isArabic ? 0.85 : 1,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    city: {
      fontFamily: isArabic ? theme.fonts.arabicSerif : theme.fonts.latin,
      fontSize: isArabic ? 12 : 11,
      color: paper,
      opacity: 0.5,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: isArabic ? 4 : 12,
    },
    name: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 28,
      lineHeight: isArabic ? 40 : 32,
      letterSpacing: isArabic ? 0 : -0.28,
      fontWeight: isArabic ? 'normal' : '700',
      color: paper,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    // Clock digits never use the Quran font — it wraps them in ayah ornaments.
    time: {
      fontFamily: isArabic ? theme.fonts.arabicSerif : theme.fonts.latin,
      fontSize: isArabic ? 30 : 28,
      lineHeight: isArabic ? 40 : 32,
      fontWeight: '700',
      color: paper,
      writingDirection: 'ltr',
    },
    meridiem: {
      fontFamily: theme.fonts.latin,
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.7,
      color: paper,
    },
    countdown: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 15 : 11,
      lineHeight: isArabic ? 22 : 14,
      letterSpacing: isArabic ? 0 : 0.4,
      color: paper,
      opacity: 0.6,
      marginTop: isArabic ? 0 : 6,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    divider: {
      height: 1,
      backgroundColor: theme.semantic.accentSoft,
      opacity: 0.3,
      marginVertical: isArabic ? 10 : 14,
    },
    strip: {
      flexDirection: 'row',
      gap: 4,
    },
    stripCell: {
      flex: 1,
      alignItems: 'center',
      gap: isArabic ? 3 : 4,
      paddingVertical: isArabic ? 2 : 6,
      borderRadius: theme.radii.sm + 2,
    },
    stripCellActive: {
      // accentSoft at 16% — ornament on teal, not brand gold.
      backgroundColor: 'rgba(226,196,128,0.16)',
    },
    stripName: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 13 : 9,
      lineHeight: isArabic ? 20 : 12,
      letterSpacing: isArabic ? 0 : 1.2,
      fontWeight: isArabic ? 'normal' : '700',
      textTransform: isArabic ? 'none' : 'uppercase',
      color: paper,
      opacity: 0.55,
    },
    stripTime: {
      fontFamily: isArabic ? theme.fonts.arabicSerif : theme.fonts.latin,
      fontSize: 13,
      lineHeight: isArabic ? 18 : 16,
      fontWeight: '600',
      color: paper,
      opacity: 0.55,
      writingDirection: 'ltr',
    },
    stripActiveText: {
      color: theme.semantic.accentSoft,
      opacity: 1,
      fontWeight: '700',
    },
  });
}
