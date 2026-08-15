import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useStrings } from '../../../constants/strings';
import { useCompassHeading } from '../../../hooks/useCompassHeading';
import { useTheme } from '../../../hooks/useTheme';
import { qiblahBearing, type GeoPoint } from '../../../services/prayerTimes';
import { useSettingsStore } from '../../../stores/settingsStore';
import { formatBearing } from '../../../utils/clock';
import { WidgetCard } from './WidgetCard';

interface Props {
  point: GeoPoint;
  size?: number;
  style?: React.ComponentProps<typeof WidgetCard>['style'];
}

/**
 * Qiblah dial drawn from the khātam geometry already in the app — north is the
 * eight-point star in Sarlawh Gold, doing the work a compass rose would do.
 * The needle rotates with the device when a compass is reporting; without one
 * it points at the raw bearing against a fixed north.
 */
export function QiblahWidget({ point, size = 92, style }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  const bearing = qiblahBearing(point);
  const heading = useCompassHeading(true);
  const needleAngle = heading === null ? bearing : (bearing - heading + 360) % 360;

  return (
    <WidgetCard label={strings.widgets.qiblahLabel} style={style}>
      <View style={styles.body}>
        <Svg width={size} height={size} viewBox="0 0 92 92">
          <Circle
            cx={46}
            cy={46}
            r={43}
            fill={theme.semantic.bg}
            stroke={theme.semantic.border}
            strokeWidth={1}
          />
          <Circle cx={46} cy={46} r={31} fill="none" stroke={theme.semantic.border} strokeWidth={1} />
          <G stroke={theme.semantic.fgSubtle} strokeWidth={1}>
            <Line x1={46} y1={6} x2={46} y2={12} />
            <Line x1={86} y1={46} x2={80} y2={46} />
            <Line x1={46} y1={86} x2={46} y2={80} />
            <Line x1={6} y1={46} x2={12} y2={46} />
          </G>
          <G transform={`translate(46 46) rotate(${needleAngle})`}>
            <Path d="M0 -30 L6 8 L0 3 L-6 8 Z" fill={theme.semantic.primary} />
          </G>
          <Circle cx={46} cy={46} r={3} fill={theme.semantic.primary} />
          <G
            transform="translate(46 8)"
            stroke={theme.semantic.qiblahNorth}
            strokeWidth={1}
            fill={theme.semantic.bg}
          >
            <Rect x={-5} y={-5} width={10} height={10} />
            <Rect x={-5} y={-5} width={10} height={10} transform="rotate(45)" />
          </G>
        </Svg>
        <View style={styles.readout}>
          <Text style={styles.bearing}>{formatBearing(bearing, isArabic)}</Text>
          <Text style={styles.caption}>{strings.widgets.qiblahCaption}</Text>
        </View>
      </View>
    </WidgetCard>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    body: {
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },
    readout: {
      alignItems: 'center',
      gap: 2,
    },
    // A bearing is a numeral, so it never takes the Quran font.
    bearing: {
      fontFamily: isArabic ? theme.fonts.arabicSerif : theme.fonts.latin,
      fontSize: 20,
      fontWeight: '700',
      color: theme.semantic.fg,
    },
    caption: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: isArabic ? 13 : 11,
      lineHeight: isArabic ? 20 : 14,
      color: theme.semantic.fgMuted,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
