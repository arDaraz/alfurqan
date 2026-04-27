import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

interface ErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);
  const resolvedMessage = message ?? strings.errorDefault;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={48}
        color={theme.semantic.danger}
        style={styles.icon}
      />
      <Text style={styles.heading}>{resolvedMessage}</Text>
      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        accessibilityLabel={strings.tryAgain}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{strings.tryAgain}</Text>
      </Pressable>
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      backgroundColor: theme.semantic.bg,
    },
    icon: {
      marginBottom: theme.spacing.md,
    },
    heading: {
      fontFamily: theme.fonts.latin,
      fontSize: 16,
      lineHeight: 24,
      color: theme.semantic.fg,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    button: {
      backgroundColor: theme.semantic.primary,
      paddingHorizontal: theme.spacing.lg,
      height: 44,
      borderRadius: theme.radii.md,
      justifyContent: 'center',
      alignItems: 'center',
      minWidth: 140,
    },
    buttonPressed: {
      backgroundColor: theme.semantic.primaryPressed,
    },
    buttonText: {
      fontFamily: theme.fonts.latin,
      fontSize: 14,
      fontWeight: '600',
      color: theme.semantic.fgOnPrimary,
    },
  });
}
