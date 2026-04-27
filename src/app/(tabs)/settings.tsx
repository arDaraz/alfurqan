import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReciterPickerSheet } from '../../components/quran/ReciterPickerSheet';
import { getReciterById } from '../../data/reciters';
import { useReciterStore } from '../../stores/reciterStore';
import { theme } from '../../constants/theme';

export default function SettingsScreen() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const selectedReciterId = useReciterStore((s) => s.selectedReciterId);
  const downloads = useReciterStore((s) => s.downloads);
  const deleteSurahDownload = useReciterStore((s) => s.deleteSurahDownload);
  const selectedReciter = getReciterById(selectedReciterId);
  const savedDownloads = Object.entries(downloads).filter(([, download]) => download.status === 'complete');
  const savedBytes = savedDownloads.reduce((total, [, download]) => total + (download.bytes ?? 0), 0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>الإعدادات</Text>

      <Pressable
        onPress={() => setPickerVisible(true)}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel="القارئ"
      >
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>القارئ</Text>
          <Text style={styles.rowValue}>{selectedReciter.nameAr}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{selectedReciter.avatarInitialAr}</Text>
        </View>
      </Pressable>

      <Pressable
        onPress={() => setSavedVisible((visible) => !visible)}
        style={styles.row}
        accessibilityRole="button"
        accessibilityLabel="التلاوات المحفوظة"
      >
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>التلاوات المحفوظة</Text>
          <Text style={styles.rowValue}>
            {savedBytes > 0 ? `${formatBytes(savedBytes)} محفوظة` : 'لا توجد تلاوات محفوظة بعد'}
          </Text>
        </View>
      </Pressable>

      {savedVisible && (
        <View style={styles.savedList}>
          {savedDownloads.length === 0 ? (
            <Text style={styles.emptyText}>لا توجد تلاوات محفوظة بعد</Text>
          ) : (
            savedDownloads.map(([key, download]) => {
              const [reciterId, surah] = key.split(':');
              return (
                <View key={key} style={styles.savedRow}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.savedTitle}>{`${reciterId} · سورة ${surah}`}</Text>
                    <Text style={styles.rowValue}>{formatBytes(download.bytes ?? 0)}</Text>
                  </View>
                  <Pressable
                    onPress={() => void deleteSurahDownload(reciterId, Number(surah))}
                    accessibilityRole="button"
                    accessibilityLabel={`حذف سورة ${surah}`}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteText}>حذف</Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}

      <ReciterPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.typography.heading.size,
    fontWeight: theme.typography.heading.weight,
    textAlign: 'right',
    marginBottom: theme.spacing.md,
  },
  row: {
    minHeight: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  rowCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rowTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  rowValue: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryDark,
    marginLeft: theme.spacing.sm,
  },
  avatarText: {
    color: theme.colors.surface,
    fontFamily: theme.fonts.arabic,
    fontSize: 18,
  },
  savedList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  savedRow: {
    minHeight: 58,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  savedTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
    textAlign: 'right',
    padding: theme.spacing.md,
  },
  deleteButton: {
    minWidth: 54,
    minHeight: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    marginRight: theme.spacing.sm,
  },
  deleteText: {
    color: theme.colors.destructive,
    fontSize: 13,
    fontWeight: '700',
  },
});
