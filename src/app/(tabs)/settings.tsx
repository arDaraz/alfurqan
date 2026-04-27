import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ReciterPickerSheet } from '../../components/quran/ReciterPickerSheet';
import { getReciterById } from '../../data/reciters';
import { useReciterStore } from '../../stores/reciterStore';
import { theme } from '../../constants/theme';

export default function SettingsScreen() {
  const [pickerVisible, setPickerVisible] = useState(false);
  const selectedReciterId = useReciterStore((s) => s.selectedReciterId);
  const selectedReciter = getReciterById(selectedReciterId);

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

      <View style={styles.row}>
        <View style={styles.rowCopy}>
          <Text style={styles.rowTitle}>التلاوات المحفوظة</Text>
          <Text style={styles.rowValue}>لا توجد تلاوات محفوظة بعد</Text>
        </View>
      </View>

      <ReciterPickerSheet visible={pickerVisible} onClose={() => setPickerVisible(false)} />
    </View>
  );
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
});
