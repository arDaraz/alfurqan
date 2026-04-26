import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';

interface Props {
  name: string;
  juzNumber: number;
  pageNumber: number;
  streakDays: number;
  avatarInitial?: string;
}

/**
 * Settings header card — gradient cream → soft-gold, gold hairline border,
 * radial highlight, avatar at start (right in RTL), streak chip at end.
 */
export function ProfileCard({
  name,
  juzNumber,
  pageNumber,
  streakDays,
  avatarInitial,
}: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const styles = createStyles(theme);

  return (
    <LinearGradient
      colors={[theme.semantic.bgRaised, theme.palette.gold[300] + '22']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.glow} />
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{avatarInitial ?? name[0] ?? 'أ'}</Text>
        </View>
        <View style={styles.who}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.position}>
            {strings.juzPosition(juzNumber, pageNumber)}
          </Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakNum}>{streakDays}</Text>
          <Text style={styles.streakLabel}>{strings.streakDays}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    card: {
      borderColor: theme.semantic.borderGold,
      borderWidth: 1,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      ...theme.elevation.shadow1,
      overflow: 'hidden',
    },
    glow: {
      position: 'absolute',
      top: -30,
      right: -30,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: theme.semantic.accentSoft,
      opacity: 0.18,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    avatar: {
      width: 54,
      height: 54,
      borderRadius: theme.radii.md + 2,
      backgroundColor: theme.semantic.primary,
      alignItems: 'center',
      justifyContent: 'center',
      ...theme.elevation.shadow1,
    },
    avatarText: {
      fontFamily: theme.fonts.quran,
      fontWeight: '600',
      fontSize: 24,
      color: theme.semantic.fgOnPrimary,
    },
    who: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontFamily: theme.fonts.quran,
      fontSize: 18,
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: 'rtl',
    },
    position: {
      fontFamily: theme.fonts.latin,
      fontSize: 10,
      color: theme.semantic.fgMuted,
      marginTop: 3,
      letterSpacing: 1.6,
      textAlign: 'left',
      fontWeight: '600',
      writingDirection: 'ltr',
    },
    streak: {
      backgroundColor: theme.semantic.bg,
      borderColor: theme.semantic.borderGold,
      borderWidth: 1,
      borderRadius: theme.radii.md,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center',
      minWidth: 54,
    },
    streakNum: {
      fontFamily: theme.fonts.latin,
      fontSize: 22,
      fontWeight: '800',
      color: theme.semantic.primary,
      lineHeight: 22,
    },
    streakLabel: {
      fontSize: 8,
      letterSpacing: 1.4,
      color: theme.semantic.fgMuted,
      textTransform: 'uppercase',
      marginTop: 3,
      fontWeight: '700',
    },
  });
}
