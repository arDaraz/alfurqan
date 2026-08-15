import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';
import { useRecitationStore } from '../../stores/recitationStore';

interface MushafBottomToolbarProps {
  onPlayPress: () => void;
  bookmarkActive?: boolean;
  onBookmarkPress?: () => void;
  onInfoPress?: () => void;
}

export function MushafBottomToolbar({
  onPlayPress,
  bookmarkActive = false,
  onBookmarkPress,
  onInfoPress,
}: MushafBottomToolbarProps) {
  const strings = useStrings();
  const router = useRouter();
  const playbackState = useRecitationStore((s) => s.state);
  const playbackDisabled = playbackState === 'playing' || playbackState === 'loading';

  return (
    <View style={styles.container}>
      <ToolbarIcon
        label={strings.reader.pageOptions}
        icon="information-outline"
        onPress={onInfoPress}
      />
      <ToolbarIcon
        label={strings.reader.surahIndex}
        icon="format-list-bulleted"
        onPress={() => router.push('/(tabs)')}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.startPractice}
        onPress={() => router.push('/practice')}
        style={styles.micButton}
      >
        <MaterialCommunityIcons name="microphone-outline" size={22} color={theme.colors.surface} />
      </Pressable>
      <ToolbarIcon
        label={strings.recitation.play}
        icon={playbackState === 'loading' ? 'loading' : 'play'}
        onPress={onPlayPress}
        disabled={playbackDisabled}
      />
      <ToolbarIcon
        label={strings.recitation.bookmark}
        icon={bookmarkActive ? 'bookmark' : 'bookmark-outline'}
        onPress={onBookmarkPress}
        active={bookmarkActive}
      />
    </View>
  );
}

interface ToolbarIconProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  disabled?: boolean;
  active?: boolean;
}

function ToolbarIcon({ label, icon, onPress, disabled = false, active = false }: ToolbarIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled && styles.disabledButton]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={21}
        color={disabled ? theme.colors.textDisabled : theme.colors.text}
      />
      {active && <View style={styles.activeIndicator} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 58,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 2,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.55,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: theme.colors.accent,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: '#E6D5A8',
  },
});
