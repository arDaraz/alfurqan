import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useStrings } from '../../constants/strings';
import { theme } from '../../constants/theme';
import { useRecitationStore } from '../../stores/recitationStore';

interface MushafBottomToolbarProps {
  onPlayPress: () => void;
}

export function MushafBottomToolbar({ onPlayPress }: MushafBottomToolbarProps) {
  const strings = useStrings();
  const playbackState = useRecitationStore((s) => s.state);
  const playbackDisabled = playbackState === 'playing' || playbackState === 'loading';

  return (
    <View style={styles.container}>
      <ToolbarIcon label="معلومات" icon="information-outline" />
      <ToolbarIcon label="القائمة" icon="format-list-bulleted" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={strings.startPractice}
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
      <ToolbarIcon label="علامة" icon="bookmark-outline" />
    </View>
  );
}

interface ToolbarIconProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  disabled?: boolean;
}

function ToolbarIcon({ label, icon, onPress, disabled = false }: ToolbarIconProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.iconButton, disabled && styles.disabledButton]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={21}
        color={disabled ? theme.colors.textDisabled : theme.colors.text}
      />
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
