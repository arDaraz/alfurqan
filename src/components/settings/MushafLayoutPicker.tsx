import React, { useContext } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { MUSHAF_LAYOUTS, type MushafLayoutId } from '../../data/mushafLayouts';
import { useSettingsStore } from '../../stores/settingsStore';
import { useStrings } from '../../constants/strings';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  visible: boolean;
  value: MushafLayoutId;
  onChange: (layoutId: MushafLayoutId) => void;
  onDismiss: () => void;
}

export function MushafLayoutPicker({ visible, value, onChange, onDismiss }: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const insets = useContext(SafeAreaInsetsContext) ?? { top: 0, right: 0, bottom: 0, left: 0 };
  const isArabic = useSettingsStore((state) => state.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.headingRow}>
            <Pressable
              onPress={onDismiss}
              accessibilityRole="button"
              accessibilityLabel={isArabic ? 'إغلاق' : 'Close'}
              style={styles.closeButton}
            >
              <Svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                accessibilityElementsHidden
              >
                <Path
                  d="M6 6l12 12M18 6 6 18"
                  stroke={theme.semantic.fgMuted}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                />
              </Svg>
            </Pressable>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>{strings.settingsMushafLayoutTitle}</Text>
              <Text style={styles.subtitle}>{strings.settingsMushafLayoutSubtitle}</Text>
            </View>
          </View>

          <View style={styles.cards}>
            {MUSHAF_LAYOUTS.map((layout) => {
              const selected = layout.id === value;
              const primaryName = isArabic ? layout.displayName.ar : layout.displayName.en;
              const secondaryName = isArabic ? layout.displayName.en : layout.displayName.ar;
              const region = isArabic ? layout.region.ar : layout.region.en;
              const attribution = isArabic ? layout.attribution.ar : layout.attribution.en;
              return (
                <Pressable
                  key={layout.id}
                  onPress={() => {
                    onChange(layout.id);
                    onDismiss();
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${primaryName}. ${strings.settingsMushafLayoutMeta(layout.pageCount, layout.linesPerPage)}`}
                  style={[styles.card, selected && styles.cardSelected]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected && <Text style={styles.check}>✓</Text>}
                  </View>
                  <View style={styles.cardCopy}>
                    <View style={styles.cardTitleRow}>
                      <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                        {primaryName}
                      </Text>
                      {selected && (
                        <Text style={styles.selectedBadge}>{strings.settingsMushafLayoutSelected}</Text>
                      )}
                    </View>
                    <Text style={styles.cardArabic}>{secondaryName}</Text>
                    <Text style={styles.meta}>
                      {region} · {strings.settingsMushafLayoutMeta(layout.pageCount, layout.linesPerPage)}
                    </Text>
                    <Text style={styles.offline}>{strings.settingsMushafLayoutOffline}</Text>
                    <Text style={styles.attribution}>{attribution}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.footer}>{strings.settingsMushafLayoutAttribution}</Text>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>, isArabic: boolean) {
  return StyleSheet.create({
    root: { flex: 1, justifyContent: 'flex-end' },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: `${theme.semantic.fg}66`,
    },
    sheet: {
      backgroundColor: theme.semantic.bgRaised,
      borderTopLeftRadius: theme.radii.xl,
      borderTopRightRadius: theme.radii.xl,
      paddingHorizontal: theme.gutter.screen,
      paddingTop: theme.spacing.sm,
      ...theme.elevation.shadow3,
    },
    handle: {
      width: theme.spacing['2xl'],
      height: theme.spacing.xs,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.borderStrong,
      alignSelf: 'center',
      marginBottom: theme.spacing.md,
    },
    headingRow: {
      // The app is globally forced to RTL. Reverse English rows to opt out of
      // React Native's automatic mirroring while retaining native Arabic flow.
      flexDirection: isArabic ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
    },
    headingCopy: { flex: 1 },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: theme.radii.pill,
      backgroundColor: theme.semantic.bgSunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: theme.semantic.fg,
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latinDisplay,
      fontSize: theme.typeScale.title.size,
      lineHeight: theme.typeScale.title.size * theme.typeScale.title.lineHeight,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    subtitle: {
      color: theme.semantic.fgMuted,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * theme.typeScale.caption.lineHeight,
      marginTop: theme.spacing.xs,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    cards: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
    card: {
      flexDirection: isArabic ? 'row' : 'row-reverse',
      alignItems: 'flex-start',
      gap: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.semantic.border,
      backgroundColor: theme.semantic.bg,
      borderRadius: theme.radii.lg,
      padding: theme.spacing.md,
    },
    cardSelected: {
      borderColor: theme.semantic.primary,
      backgroundColor: theme.semantic.primaryTint,
    },
    radio: {
      width: theme.spacing.lg,
      height: theme.spacing.lg,
      borderRadius: theme.radii.pill,
      borderWidth: 1,
      borderColor: theme.semantic.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: theme.spacing.xs,
    },
    radioSelected: { backgroundColor: theme.semantic.primary, borderColor: theme.semantic.primary },
    check: {
      color: theme.semantic.fgOnPrimary,
      fontFamily: theme.fonts.latin,
      fontSize: theme.typeScale.label.size,
      fontWeight: '700',
    },
    cardCopy: { flex: 1, minWidth: 0 },
    cardTitleRow: {
      flexDirection: isArabic ? 'row' : 'row-reverse',
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    cardTitle: {
      flex: 1,
      color: theme.semantic.fg,
      fontFamily: isArabic ? theme.fonts.arabicSemiBold : theme.fonts.latin,
      fontSize: theme.typeScale.body.size,
      lineHeight: theme.typeScale.body.size * theme.typeScale.body.lineHeight,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    cardTitleSelected: { color: theme.semantic.primary },
    selectedBadge: {
      color: theme.semantic.primary,
      fontFamily: isArabic ? theme.fonts.arabicMedium : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    cardArabic: {
      color: theme.semantic.fgMuted,
      fontFamily: isArabic ? theme.fonts.latin : theme.fonts.arabic,
      fontSize: theme.typeScale.label.size,
      lineHeight: theme.typeScale.label.size * theme.typeScale.label.lineHeight,
      marginTop: theme.spacing.xs,
      textAlign: 'left',
      writingDirection: isArabic ? 'ltr' : 'rtl',
    },
    meta: {
      color: theme.semantic.fgMuted,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * theme.typeScale.caption.lineHeight,
      marginTop: theme.spacing.sm,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    offline: {
      color: theme.semantic.success,
      fontFamily: isArabic ? theme.fonts.arabicMedium : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      marginTop: theme.spacing.xs,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    attribution: {
      color: theme.semantic.fgSubtle,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * theme.typeScale.caption.lineHeight,
      marginTop: theme.spacing.sm,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
    footer: {
      color: theme.semantic.fgSubtle,
      fontFamily: isArabic ? theme.fonts.arabic : theme.fonts.latin,
      fontSize: theme.typeScale.caption.size,
      lineHeight: theme.typeScale.caption.size * theme.typeScale.caption.lineHeight,
      marginTop: theme.spacing.md,
      textAlign: 'center',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
  });
}
