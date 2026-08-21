import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  label: string;
  value: number;
  onChange: (next: number) => void;
}

const ADJUST_ACTIONS = [{ name: 'increment' }, { name: 'decrement' }] as const;
const STEP = 0.1;

export function FontSizeRow({ label, value, onChange }: Props) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const trackRef = useRef<View>(null);
  const trackLayout = useRef({ x: 0, width: 0 });
  const previewSize = 18 + Math.round(value * 18);

  const updateFromPageX = (pageX: number) => {
    const { x, width } = trackLayout.current;
    if (!width) return;
    const ratio = (pageX - x) / width;
    onChange(Math.max(0, Math.min(1, ratio)));
  };

  const handleGrant = (e: GestureResponderEvent) => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLayout.current = { x, width };
      updateFromPageX(e.nativeEvent.pageX);
    });
  };

  const handleMove = (e: GestureResponderEvent) => {
    updateFromPageX(e.nativeEvent.pageX);
  };

  const percent = Math.round(value * 100);
  const handleAccessibilityAction = (
    event: NativeSyntheticEvent<{ actionName: string }>
  ) => {
    const step = event.nativeEvent.actionName === 'increment' ? STEP : -STEP;
    onChange(Math.max(0, Math.min(1, value + step)));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.k}>{label}</Text>
        <Text style={styles.v}>A · {percent}%</Text>
      </View>
      <Text style={[styles.preview, { fontSize: previewSize, lineHeight: previewSize * 1.6 }]}>
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Text>
      <View
        ref={trackRef}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: 100, now: percent, text: `${percent}%` }}
        accessibilityActions={ADJUST_ACTIONS}
        onAccessibilityAction={handleAccessibilityAction}
        style={styles.track}
      >
        <View style={styles.trackBg} />
        <View style={[styles.trackFill, { width: `${value * 100}%` }]} />
        <View style={[styles.knob, { left: `${value * 100}%` }]} />
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    wrap: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    k: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 15,
      color: theme.semantic.fg,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    v: {
      fontFamily: theme.fonts.latin,
      fontSize: 10,
      color: theme.semantic.accent,
      letterSpacing: 1.6,
      fontWeight: '700',
    },
    preview: {
      fontFamily: theme.fonts.quran,
      color: theme.semantic.fg,
      textAlign: 'center',
      paddingTop: 14,
      paddingBottom: 8,
    },
    track: {
      height: 24,
      justifyContent: 'center',
      marginTop: 2,
      direction: 'ltr' as any,
    },
    trackBg: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 10,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.semantic.accentSoft,
    },
    trackFill: {
      position: 'absolute',
      left: 0,
      top: 10,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.semantic.primary,
    },
    knob: {
      position: 'absolute',
      top: 3,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 2,
      borderColor: theme.semantic.primary,
      ...theme.elevation.shadow2,
      marginLeft: -9,
    },
  });
}
