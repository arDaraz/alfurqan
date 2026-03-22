import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

/**
 * Decorative Bismillah display.
 * Renders the Uthmani Bismillah text centered with optional gold ornamental dots.
 * Appears at the start of each surah except:
 * - Surah 1 (Al-Fatiha): Bismillah is ayah 1 itself
 * - Surah 9 (At-Tawbah): No Bismillah
 */
export function Bismillah() {
  return (
    <View style={styles.container}>
      {/* Ornamental dots above */}
      <View style={styles.ornamentalDots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotCenter]} />
        <View style={styles.dot} />
      </View>

      <Text style={styles.bismillahText}>
        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </Text>

      {/* Ornamental dots below */}
      <View style={styles.ornamentalDots}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotCenter]} />
        <View style={styles.dot} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 0, // Comes right after surah header's 48px bottom margin
    marginBottom: theme.spacing.lg, // 24px before first ayah
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl, // 32px
  },
  bismillahText: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: theme.typography.body.size, // 18px per UI-SPEC
    fontWeight: '400', // Regular weight for Bismillah
    color: theme.colors.text, // #1A1A2E
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  ornamentalDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.xs, // 4px
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C9A84C', // Gold ornamental
    opacity: 0.6,
    marginHorizontal: theme.spacing.sm, // 8px
  },
  dotCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
});
