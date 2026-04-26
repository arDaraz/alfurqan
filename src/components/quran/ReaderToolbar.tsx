import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  onBookmark?: () => void;
  onListen?: () => void;
  onTranslation?: () => void;
  onInfo?: () => void;
}

/**
 * Reader floating toolbar — 5-column with central primary Tasmi' button.
 * Slot order (LTR): bookmark · listen · TASMI · translation · info.
 */
export function ReaderToolbar({ onBookmark, onListen, onTranslation, onInfo }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);

  return (
    <View style={[styles.wrap, { bottom: 14 + Math.max(insets.bottom - 8, 0) }]} pointerEvents="box-none">
      <View style={styles.bar}>
        <ToolButton onPress={onBookmark}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </ToolButton>
        <ToolButton onPress={onListen}>
          <Svg width={20} height={20} viewBox="0 0 24 24">
            <Path d="M8 5v14l11-7z" fill={theme.semantic.fg} />
          </Svg>
        </ToolButton>
        <ToolButton primary onPress={() => router.push('/practice' as never)}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Rect x={9} y={3} width={6} height={12} rx={3} stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} />
            <Path d="M5 11a7 7 0 0 0 14 0" stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} strokeLinecap="round" />
            <Path d="M12 18v3" stroke={theme.semantic.fgOnPrimary} strokeWidth={1.75} strokeLinecap="round" />
          </Svg>
        </ToolButton>
        <ToolButton onPress={onTranslation}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M4 6h16M4 12h16M4 18h10" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinecap="round" />
          </Svg>
        </ToolButton>
        <ToolButton onPress={onInfo}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={theme.semantic.fg} strokeWidth={1.75} />
            <Path d="M12 8v4M12 16h.01" stroke={theme.semantic.fg} strokeWidth={1.75} strokeLinecap="round" />
          </Svg>
        </ToolButton>
      </View>
    </View>
  );
}

function ToolButton({
  children,
  primary,
  onPress,
}: {
  children: React.ReactNode;
  primary?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        primary && styles.btnPrimary,
        pressed && styles.btnPressed,
      ]}
    >
      {primary && <View style={styles.primaryHalo} />}
      {children}
    </Pressable>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      left: 18,
      right: 18,
    },
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.semantic.bgRaised,
      borderColor: theme.semantic.border,
      borderWidth: 1,
      borderRadius: theme.radii.md + 4,
      padding: 10,
      gap: 6,
      ...theme.elevation.shadow3,
    },
    btn: {
      flex: 1,
      height: 44,
      borderRadius: theme.radii.sm + 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnPrimary: {
      backgroundColor: theme.semantic.primary,
      ...theme.elevation.shadow1,
    },
    btnPressed: {
      opacity: 0.85,
    },
    primaryHalo: {
      position: 'absolute',
      top: -3,
      bottom: -3,
      left: -3,
      right: -3,
      borderRadius: theme.radii.sm + 7,
      borderColor: theme.semantic.accentSoft,
      borderWidth: 1,
      opacity: 0.55,
    },
  });
}
