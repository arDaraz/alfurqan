import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { RECITERS, type Reciter } from '../../data/reciters';
import { recitationEngine } from '../../services/recitationEngine';
import { downloadKey, useReciterStore } from '../../stores/reciterStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { theme } from '../../constants/theme';

interface ReciterPickerSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ReciterPickerSheet({ visible, onClose }: ReciterPickerSheetProps) {
  const language = useSettingsStore((s) => s.language);
  const selectedReciterId = useReciterStore((s) => s.selectedReciterId);
  const downloads = useReciterStore((s) => s.downloads);

  const handleSelect = (reciterId: string) => {
    void recitationEngine.setReciter(reciterId);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={styles.sheet}>
          <Text style={styles.title}>القارئ</Text>
          {RECITERS.map((reciter) => {
            const selected = reciter.id === selectedReciterId;
            const hasDownload = Object.keys(downloads).some(
              (key) => key.startsWith(`${reciter.id}:`) && downloads[key].status === 'complete'
            );
            return (
              <ReciterCard
                key={reciter.id}
                reciter={reciter}
                selected={selected}
                downloaded={hasDownload || Boolean(downloads[downloadKey(reciter.id, 1)]?.bytes)}
                language={language}
                onPress={() => handleSelect(reciter.id)}
              />
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

interface ReciterCardProps {
  reciter: Reciter;
  selected: boolean;
  downloaded: boolean;
  language: 'ar' | 'en';
  onPress: () => void;
}

function ReciterCard({ reciter, selected, downloaded, language, onPress }: ReciterCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={language === 'ar' ? reciter.nameAr : reciter.nameEn}
      style={[styles.card, selected && styles.selectedCard]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{reciter.avatarInitialAr}</Text>
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{language === 'ar' ? reciter.nameAr : reciter.nameEn}</Text>
        <Text style={styles.meta}>{language === 'ar' ? reciter.rivayahAr : reciter.rivayahEn}</Text>
      </View>
      <Text style={[styles.badge, selected && styles.selectedBadge]}>
        {downloaded ? 'محفوظ' : selected ? 'محدد' : `${reciter.bitrate}kbps`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: theme.spacing.sm,
  },
  card: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    backgroundColor: '#FFFDF6',
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.selectedRange,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
  },
  avatarText: {
    color: theme.colors.surface,
    fontSize: 18,
    fontFamily: theme.fonts.arabic,
  },
  copy: {
    flex: 1,
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.sm,
  },
  name: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    minWidth: 58,
    textAlign: 'center',
  },
  selectedBadge: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
