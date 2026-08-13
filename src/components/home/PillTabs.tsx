import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { useSettingsStore } from '../../stores/settingsStore';

export interface PillTabItem<T extends string> {
  id: T;
  label: string;
  count?: string;
}

interface Props<T extends string> {
  tabs: readonly PillTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

/**
 * Sunken pill-tabs control — segmented selector inside a `bgSunken` track.
 * Active pill takes `--primary` with a soft `shadow-1`. Optional `count` per tab
 * renders a small inline chip after the label.
 */
export function PillTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  const theme = useTheme();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <View style={styles.track}>
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            onPress={() => onChange(t.id)}
            style={[styles.tab, isActive && styles.tabActive]}
          >
            <Text style={[styles.label, isActive && styles.labelActive]}>{t.label}</Text>
            {t.count !== undefined && (
              <View style={[styles.countChip, isActive && styles.countChipActive]}>
                <Text style={[styles.countText, isActive && styles.countTextActive]}>
                  {t.count}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    track: {
      direction: isArabic ? 'rtl' : 'ltr',
      flexDirection: 'row',
      backgroundColor: theme.semantic.bgSunken,
      borderRadius: theme.radii.xl,
      padding: 4,
      gap: 4,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: theme.radii.xl - 4,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    tabActive: {
      backgroundColor: theme.semantic.primary,
      ...theme.elevation.shadow1,
    },
    label: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 14,
      color: theme.semantic.fgMuted,
      fontWeight: isArabic ? 'normal' : '600',
    },
    labelActive: {
      color: theme.semantic.fgOnPrimary,
    },
    countChip: {
      minWidth: 22,
      paddingHorizontal: 7,
      paddingVertical: 1,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.bgRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countChipActive: {
      backgroundColor: theme.semantic.fgOnPrimary + '33',
    },
    countText: {
      fontFamily: theme.fonts.arabic,
      fontSize: 12,
      color: theme.semantic.fgMuted,
    },
    countTextActive: {
      color: theme.semantic.fgOnPrimary,
    },
  });
}
