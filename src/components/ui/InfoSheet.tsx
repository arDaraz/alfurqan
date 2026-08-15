import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useStrings } from '../../constants/strings';
import { useSettingsStore } from '../../stores/settingsStore';

export interface InfoSheetRow {
  label: string;
  value: string;
  /** The Arabic UI font draws digits inside ayah-marker ornaments, so numbers opt out of it. */
  numeric?: boolean;
}

interface Props {
  visible: boolean;
  title: string;
  rows: InfoSheetRow[];
  note?: string;
  onClose: () => void;
}

/** Read-only detail sheet shared by the reader page info and the About row. */
export function InfoSheet({ visible, title, rows, note, onClose }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.scrim}>
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel={strings.close}
          onPress={onClose}
        />
        <View style={styles.sheet} accessibilityViewIsModal accessibilityLabel={title}>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text
                style={[styles.rowValue, row.numeric && styles.rowValueNumeric]}
                numberOfLines={2}
              >
                {row.value}
              </Text>
            </View>
          ))}
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.close}
            onPress={onClose}
            style={styles.closeHitArea}
          >
            {({ pressed }) => (
              <View style={[styles.closeBtn, pressed && styles.closeBtnPressed]}>
                <Text style={styles.closeText}>{strings.close}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    scrim: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: theme.gutter.screen,
      backgroundColor: 'rgba(0,0,0,0.38)',
    },
    sheet: {
      direction: isArabic ? 'rtl' : 'ltr',
      backgroundColor: theme.semantic.bgRaised,
      borderRadius: theme.radii.lg,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      borderTopWidth: 2,
      borderTopColor: theme.semantic.accent,
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.sm,
      ...theme.elevation.shadow3,
    },
    title: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latin,
      fontSize: 17,
      fontWeight: '700',
      color: theme.semantic.fg,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      marginBottom: theme.spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: theme.spacing.md,
      paddingVertical: 7,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.semantic.border,
    },
    rowLabel: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: 13,
      color: theme.semantic.fgMuted,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    rowValue: {
      flex: 1,
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latin,
      fontSize: 14,
      fontWeight: '600',
      color: theme.semantic.fg,
      textAlign: 'right',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    rowValueNumeric: {
      fontFamily: theme.fonts.latin,
      fontWeight: '700',
    },
    note: {
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: 12,
      lineHeight: 18,
      color: theme.semantic.fgSubtle,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
      paddingTop: theme.spacing.xs,
    },
    closeHitArea: {
      alignSelf: 'flex-end',
      marginTop: theme.spacing.xs,
    },
    closeBtn: {
      minHeight: 40,
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.primary,
    },
    closeBtnPressed: { opacity: 0.8 },
    closeText: {
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latin,
      fontSize: 14,
      fontWeight: '600',
      color: theme.semantic.fgOnPrimary,
    },
  });
}
