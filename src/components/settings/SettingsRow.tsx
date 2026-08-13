import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isLast?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
}

export function SettingsRow({ icon, label, value, isLast, onPress, trailing }: Props) {
  const theme = useTheme();
  const language = useSettingsStore((s) => s.language);
  const isArabic = language === 'ar';
  const styles = createStyles(theme, !!isLast, isArabic);

  const row = (
    <View testID={`settings-row-${label}`} style={styles.row}>
      <View style={styles.iconWrap}>{icon}</View>
      <View style={styles.text}>
        <Text style={styles.k}>{label}</Text>
        {value && <Text style={styles.v}>{value}</Text>}
      </View>
      <View style={styles.trailing}>
        {trailing ?? (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d={isArabic ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
              stroke={theme.semantic.fgSubtle}
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </View>
  );

  if (!onPress) return row;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View testID={`settings-row-${label}`} style={[styles.row, pressed && { opacity: 0.7 }]}>
          <View style={styles.iconWrap}>{icon}</View>
          <View style={styles.text}>
            <Text style={styles.k}>{label}</Text>
            {value && <Text style={styles.v}>{value}</Text>}
          </View>
          <View style={styles.trailing}>
            {trailing ?? (
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d={isArabic ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'}
                  stroke={theme.semantic.fgSubtle}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            )}
          </View>
        </View>
      )}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isLast: boolean, isArabic: boolean) {
  return StyleSheet.create({
    row: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 14,
      gap: 12,
      borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: theme.radii.sm + 2,
      backgroundColor: theme.semantic.primaryTint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      flex: 1,
    },
    k: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 15,
      color: theme.semantic.fg,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      lineHeight: 18,
      fontWeight: isArabic ? 'normal' : '500',
    },
    v: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 11,
      color: theme.semantic.fgMuted,
      marginTop: 3,
      letterSpacing: 0.22,
      textAlign: isArabic ? 'left' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    trailing: {
      flexShrink: 0,
    },
  });
}
