import React, { useState } from 'react';
import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useStrings } from '../../constants/strings';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: SearchBarProps) {
  const strings = useStrings();
  const resolvedPlaceholder = placeholder ?? strings.searchPlaceholder;
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused ? styles.containerFocused : styles.containerUnfocused,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.textDisabled}
        style={styles.icon}
      />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={theme.colors.textDisabled}
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
          <Ionicons
            name="close-circle"
            size={20}
            color={theme.colors.textDisabled}
          />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  containerFocused: {
    borderWidth: 2,
    borderColor: '#0D7377',
  },
  containerUnfocused: {
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.label.size,
    color: theme.colors.text,
    height: 44,
    padding: 0,
    textAlign: 'right',
  },
});
