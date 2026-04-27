import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReciterPickerSheet } from './ReciterPickerSheet';
import { getReciterById } from '../../data/reciters';
import { getAyahTextRange } from '../../data/quranRepository';
import { recitationEngine } from '../../services/recitationEngine';
import { downloadKey, useReciterStore } from '../../stores/reciterStore';
import { useRecitationStore, type PlaybackSpeed } from '../../stores/recitationStore';
import { theme } from '../../constants/theme';
import { useStrings } from '../../constants/strings';

interface PlayerSheetProps {
  visible: boolean;
  onClose: () => void;
}

const SPEEDS: PlaybackSpeed[] = [0.75, 1, 1.25, 1.5];

export function PlayerSheet({ visible, onClose }: PlayerSheetProps) {
  const strings = useStrings();
  const state = useRecitationStore((s) => s.state);
  const range = useRecitationStore((s) => s.range);
  const currentAyah = useRecitationStore((s) => s.currentAyah);
  const mode = useRecitationStore((s) => s.mode);
  const speed = useRecitationStore((s) => s.speed);
  const positionSeconds = useRecitationStore((s) => s.positionSeconds);
  const durationSeconds = useRecitationStore((s) => s.durationSeconds);
  const selectedReciterId = useReciterStore((s) => s.selectedReciterId);
  const downloads = useReciterStore((s) => s.downloads);
  const startSurahDownload = useReciterStore((s) => s.startSurahDownload);
  const cancelSurahDownload = useReciterStore((s) => s.cancelSurahDownload);
  const [ayahText, setAyahText] = useState('');
  const [reciterPickerVisible, setReciterPickerVisible] = useState(false);
  const reciter = getReciterById(selectedReciterId);

  useEffect(() => {
    let cancelled = false;
    if (!visible || !range || currentAyah === null) {
      setAyahText('');
      return;
    }

    getAyahTextRange(range.surah, currentAyah, currentAyah)
      .then((text) => {
        if (!cancelled) setAyahText(text);
      })
      .catch(() => {
        if (!cancelled) setAyahText('');
      });

    return () => {
      cancelled = true;
    };
  }, [currentAyah, range, visible]);

  const progress = durationSeconds > 0
    ? Math.max(0, Math.min(1, positionSeconds / durationSeconds))
    : 0;

  const midpoint = useMemo(
    () => Math.max(0, Math.round((durationSeconds || 0) / 2)),
    [durationSeconds]
  );
  const currentDownload = range
    ? downloads[downloadKey(selectedReciterId, range.surah)]
    : undefined;

  const handleSpeed = () => {
    const index = SPEEDS.indexOf(speed);
    const next = SPEEDS[(index + 1) % SPEEDS.length];
    void recitationEngine.setSpeed(next);
  };

  const handleRepeat = () => {
    recitationEngine.setMode(mode === 'loop-surah' ? 'continuous' : 'loop-surah');
  };

  const handlePlayPause = () => {
    if (state === 'paused') {
      void recitationEngine.resume();
    } else if (state === 'playing' || state === 'loading') {
      void recitationEngine.pause();
    }
  };

  const handleDownload = () => {
    if (!range) return;
    if (currentDownload?.status === 'downloading') {
      cancelSurahDownload(selectedReciterId, range.surah);
      return;
    }
    if (currentDownload?.status === 'complete') return;
    void startSurahDownload(selectedReciterId, range.surah);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable
              onPress={onClose}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={strings.back}
            >
              <MaterialCommunityIcons name="close" size={20} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.heading}>{strings.recitation.playing}</Text>
          </View>

          <View style={styles.reciterRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{reciter.avatarInitialAr}</Text>
            </View>
            <View style={styles.reciterCopy}>
              <Text style={styles.reciterName}>{reciter.nameAr}</Text>
              <Text style={styles.reciterMeta}>{reciter.rivayahAr}</Text>
            </View>
          </View>

          <View style={styles.ayahCard}>
            <Text style={styles.ayahMeta}>
              {range && currentAyah !== null
                ? strings.recitation.nowPlayingAyah(range.surah, currentAyah)
                : strings.recitation.loading}
            </Text>
            <Text style={styles.ayahText}>{ayahText || strings.recitation.loading}</Text>
          </View>

          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="منتصف المقطع"
            onPress={() => recitationEngine.seek(midpoint)}
            style={styles.seekArea}
          >
            <View style={styles.timeRow}>
              <Text style={styles.time}>{formatTime(positionSeconds)}</Text>
              <Text style={styles.time}>{formatTime(durationSeconds)}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </Pressable>

          <View style={styles.transportRow}>
            <SheetButton label="السابق" icon="skip-previous" onPress={() => recitationEngine.prev()} />
            <SheetButton label="إيقاف" icon="stop" onPress={() => recitationEngine.stop()} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={state === 'paused' ? strings.recitation.play : strings.recitation.pause}
              onPress={handlePlayPause}
              style={styles.primaryTransport}
            >
              <MaterialCommunityIcons
                name={state === 'paused' ? 'play' : 'pause'}
                size={26}
                color={theme.colors.surface}
              />
            </Pressable>
            <SheetButton label="التالي" icon="skip-next" onPress={() => recitationEngine.next()} />
            <SheetButton
              label="القارئ"
              icon="account-voice"
              onPress={() => setReciterPickerVisible(true)}
            />
          </View>

          <View style={styles.modeStrip}>
            <SheetButton label="معلومات" icon="information-outline" compact />
            <SheetButton label="السرعة" icon="speedometer" compact onPress={handleSpeed} />
            <SheetButton
              label="تحميل"
              icon={currentDownload?.status === 'complete' ? 'check-circle-outline' : 'download-outline'}
              compact
              selected={currentDownload?.status === 'downloading' || currentDownload?.status === 'complete'}
              onPress={handleDownload}
            />
            <SheetButton
              label="التكرار"
              icon="repeat"
              compact
              selected={mode === 'loop-surah'}
              onPress={handleRepeat}
            />
          </View>

          <Text style={styles.speedLabel}>{speed}x</Text>
          <ReciterPickerSheet
            visible={reciterPickerVisible}
            onClose={() => setReciterPickerVisible(false)}
          />
        </View>
      </View>
    </Modal>
  );
}

interface SheetButtonProps {
  label: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  onPress?: () => void;
  compact?: boolean;
  selected?: boolean;
}

function SheetButton({ label, icon, onPress, compact = false, selected = false }: SheetButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[
        compact ? styles.compactButton : styles.transportButton,
        selected && styles.selectedButton,
      ]}
    >
      <MaterialCommunityIcons
        name={icon}
        size={compact ? 18 : 22}
        color={selected ? theme.colors.primary : theme.colors.text}
      />
    </Pressable>
  );
}

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  sheet: {
    minHeight: 430,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heading: {
    color: theme.colors.text,
    fontSize: theme.typography.label.size,
    fontWeight: '700',
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reciterRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    borderWidth: 1,
    borderColor: '#D8BE7A',
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 20,
    fontFamily: theme.fonts.arabic,
  },
  reciterCopy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingRight: theme.spacing.md,
  },
  reciterName: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  reciterMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  ayahCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: '#FFFDF6',
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
  },
  ayahMeta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'right',
  },
  ayahText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.arabic,
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
  },
  seekArea: {
    marginTop: theme.spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  time: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFE8D8',
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: theme.colors.accent,
  },
  transportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  transportButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryTransport: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  modeStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  compactButton: {
    width: 48,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  selectedButton: {
    backgroundColor: theme.colors.selectedRange,
    borderColor: theme.colors.primary,
  },
  speedLabel: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
