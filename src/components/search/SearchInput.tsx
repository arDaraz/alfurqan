import React from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

interface Props {
  value: string;
  onChangeText: (next: string) => void;
  autoFocus?: boolean;
  onFiltersPress?: () => void;
}

export function SearchInput({ value, onChangeText, autoFocus = false, onFiltersPress }: Props) {
  const strings = useStrings();
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);
  const hasValue = value.length > 0;

  return (
    <View style={styles.wrap} accessible={false}>
      <View style={styles.searchIconWrap} pointerEvents="none">
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={theme.semantic.fgMuted} strokeWidth={1.75} />
          <Path d="m20 20-3.5-3.5" stroke={theme.semantic.fgMuted} strokeWidth={1.75} strokeLinecap="round" />
        </Svg>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={strings.searchAyahsPlaceholder}
        placeholderTextColor={theme.semantic.fgSubtle}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
        autoFocus={autoFocus}
        returnKeyType="search"
        accessibilityLabel={strings.searchAyahsPlaceholder}
        clearButtonMode="never"
      />
      <View style={styles.trailingCluster}>
        {hasValue && (
          <Pressable
            onPress={() => onChangeText('')}
            accessibilityRole="button"
            accessibilityLabel={strings.searchClearAria}
            hitSlop={10}
          >
            {({ pressed }) => (
              <View style={[styles.iconButton, pressed && styles.iconButtonPressed]}>
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="m6 6 12 12M18 6 6 18"
                    stroke={theme.semantic.fg}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                  />
                </Svg>
              </View>
            )}
          </Pressable>
        )}
        {onFiltersPress && (
          <Pressable
            onPress={onFiltersPress}
            style={({ pressed }) => [styles.filterButton, pressed && styles.filterButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel={strings.searchFiltersAria}
            hitSlop={10}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M4 6h11M4 12h7M4 18h4"
                stroke={theme.semantic.fg}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Circle cx={18} cy={6} r={2} fill={theme.semantic.fg} />
              <Circle cx={14} cy={12} r={2} fill={theme.semantic.fg} />
              <Circle cx={11} cy={18} r={2} fill={theme.semantic.fg} />
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: 10,
      paddingStart: theme.spacing.md,
      paddingEnd: theme.spacing.xs + 2,
      minHeight: 48,
      marginHorizontal: theme.gutter.screen,
      borderWidth: 1,
      borderColor: '#0E272422',
    },
    searchIconWrap: {
      width: 22,
      height: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginEnd: theme.spacing.sm + 2,
    },
    input: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * theme.typeScale.body.lineHeight,
      color: theme.semantic.fg,
      textAlign: isArabic ? 'right' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      paddingVertical: 10,
      padding: 0,
    },
    trailingCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      marginStart: theme.spacing.xs,
    },
    iconButton: {
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.bg,
      borderWidth: 1,
      borderColor: '#0E272422',
    },
    iconButtonPressed: {
      backgroundColor: theme.semantic.bgSunken,
    },
    filterButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.pill,
    },
    filterButtonPressed: {
      backgroundColor: theme.semantic.bg,
    },
  });
}
