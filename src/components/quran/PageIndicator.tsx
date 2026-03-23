import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';

interface PageIndicatorProps {
  currentPage: number;
}

export function PageIndicator({ currentPage }: PageIndicatorProps) {
  const strings = useStrings();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {strings.mushafPageIndicator(currentPage)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: theme.typography.label.size,
    fontWeight: '600',
    color: theme.colors.accent,
  },
});
