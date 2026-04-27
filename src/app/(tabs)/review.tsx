import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { OrnamentDivider } from '../../components/brand/OrnamentDivider';

export default function ReviewScreen() {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.center}>
        <OrnamentDivider tier="medium" color={theme.semantic.accent} darkMode={theme.mode === 'dark'} />
        <Text style={styles.title}>{strings.tabReview}</Text>
        <Text style={styles.body}>{strings.practiceComingSoonMsg}</Text>
      </View>
    </SafeAreaView>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.semantic.bg },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
      gap: theme.spacing.lg,
    },
    title: {
      fontFamily: theme.fonts.arabic,
      fontSize: theme.typeScale.heading.size,
      lineHeight: theme.typeScale.heading.size * theme.typeScale.heading.lineHeight,
      color: theme.semantic.fg,
      textAlign: 'center',
    },
    body: {
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * theme.typeScale.body.lineHeight,
      color: theme.semantic.fgMuted,
      textAlign: 'center',
      maxWidth: 320,
    },
  });
}
