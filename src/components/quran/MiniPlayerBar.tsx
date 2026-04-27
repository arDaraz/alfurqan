import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getReciterById, DEFAULT_RECITER_ID } from '../../data/reciters';
import { recitationEngine } from '../../services/recitationEngine';
import { useRecitationStore } from '../../stores/recitationStore';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';

export function MiniPlayerBar() {
  const strings = useStrings();
  const state = useRecitationStore((s) => s.state);
  const range = useRecitationStore((s) => s.range);
  const currentAyah = useRecitationStore((s) => s.currentAyah);
  const positionSeconds = useRecitationStore((s) => s.positionSeconds);
  const durationSeconds = useRecitationStore((s) => s.durationSeconds);
  const errorMessage = useRecitationStore((s) => s.errorMessage);

  if (state === 'idle' || !range || currentAyah === null) return null;

  const reciter = getReciterById(DEFAULT_RECITER_ID);
  const progress =
    durationSeconds > 0 ? Math.max(0, Math.min(1, positionSeconds / durationSeconds)) : 0;
  const isPaused = state === 'paused';
  const isLoading = state === 'loading';
  const isError = state === 'error';

  const handlePlayPause = () => {
    if (isError) {
      recitationEngine.retry();
    } else if (isPaused) {
      recitationEngine.resume();
    } else if (state === 'playing' || isLoading) {
      recitationEngine.pause();
    }
  };

  return (
    <View style={[styles.container, isError && styles.errorContainer]}>
      <Pressable
        onPress={handlePlayPause}
        style={[styles.roundButton, isLoading && styles.loadingButton]}
        accessibilityRole="button"
        accessibilityLabel={isPaused ? strings.recitation.play : strings.recitation.pause}
      >
        <MaterialCommunityIcons
          name={isPaused || isError ? 'play' : 'pause'}
          size={18}
          color={theme.colors.surface}
        />
      </Pressable>

      <Pressable
        onPress={() => recitationEngine.stop()}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel={strings.recitation.stop}
      >
        <MaterialCommunityIcons name="stop" size={16} color={theme.colors.text} />
      </Pressable>

      <View style={styles.copy}>
        <Text style={styles.reciterName} numberOfLines={1}>
          {isLoading ? strings.recitation.loading : reciter.nameAr}
        </Text>
        <Text style={[styles.ayahLabel, isError && styles.errorText]} numberOfLines={1}>
          {isError
            ? errorMessage ?? strings.recitation.error
            : strings.recitation.nowPlayingAyah(range.surah, currentAyah)}
        </Text>
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{reciter.avatarInitialAr}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8BE7A',
    backgroundColor: '#FFFDF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    overflow: 'hidden',
  },
  errorContainer: {
    borderColor: theme.colors.destructive,
  },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  loadingButton: {
    opacity: 0.75,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: theme.spacing.xs,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
  },
  reciterName: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  ayahLabel: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  errorText: {
    color: theme.colors.destructive,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D8BE7A',
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 16,
    fontFamily: theme.fonts.arabic,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
    backgroundColor: '#EFE8D8',
  },
  progressFill: {
    height: 2,
    backgroundColor: theme.colors.accent,
  },
});
