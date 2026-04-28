import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  const theme = useTheme();
  const strings = useStrings();
  const resolvedPlaceholder = placeholder ?? strings.searchPlaceholder;
  const [isFocused, setIsFocused] = useState(false);
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : styles.containerUnfocused,
      ]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx={11} cy={11} r={7} stroke={theme.semantic.fgMuted} strokeWidth={1.75} />
        <Path d="m20 20-3-3" stroke={theme.semantic.fgMuted} strokeWidth={1.75} strokeLinecap="round" />
      </Svg>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={theme.semantic.fgSubtle}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Search surahs"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={8}
          accessibilityLabel="Clear search"
          accessibilityRole="button"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} fill={theme.semantic.fgSubtle} />
            <Line x1={9} y1={9} x2={15} y2={15} stroke={theme.semantic.bgRaised} strokeWidth={1.75} strokeLinecap="round" />
            <Line x1={15} y1={9} x2={9} y2={15} stroke={theme.semantic.bgRaised} strokeWidth={1.75} strokeLinecap="round" />
          </Svg>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    container: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.sm + 4,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    containerFocused: {
      borderWidth: 2,
      borderColor: theme.semantic.primary,
    },
    containerUnfocused: {
      borderWidth: 1,
      borderColor: theme.semantic.border,
    },
    input: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 14,
      color: theme.semantic.fg,
      padding: 0,
      textAlign: isArabic ? 'right' : 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
