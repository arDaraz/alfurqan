import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({
  message = 'Unable to load Quran text. Please restart the app.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color="#DC2626"
        style={styles.icon}
      />
      <Text style={styles.heading}>{message}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        accessibilityLabel="Try Again"
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  icon: {
    marginBottom: theme.spacing.md,
  },
  heading: {
    fontSize: theme.typography.body.size,
    fontWeight: '400',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: theme.typography.body.size * theme.typography.body.latinLineHeight,
  },
  button: {
    backgroundColor: '#0D7377',
    paddingHorizontal: theme.spacing.md,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
  },
  buttonPressed: {
    backgroundColor: '#0B6163',
  },
  buttonText: {
    fontSize: theme.typography.label.size,
    fontWeight: '600',
    color: theme.colors.surface,
  },
});
