import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import type { AyahSelection, AyahActionType } from '../../data/types';

interface AyahPopupProps {
  selection: AyahSelection;
  x: number;
  y: number;
  onAction: (action: AyahActionType, selection: AyahSelection) => void;
  onDismiss: () => void;
}

const POPUP_HEIGHT = 65;
const POPUP_WIDTH = 380;
const TAIL_SIZE = 12;

type SvgEl =
  | { type: 'path'; d: string }
  | { type: 'circle'; cx: number; cy: number; r: number }
  | { type: 'rect'; x: number; y: number; width: number; height: number; rx?: number };

interface ActionDef {
  key: AyahActionType;
  label: string;
  elements: SvgEl[];
  primary?: boolean;
}

const ACTIONS: ActionDef[] = [
  { key: 'play', label: 'تشغيل', primary: true, elements: [
    { type: 'path', d: 'M8 5v14l11-7z' },
  ]},
  { key: 'tafsir', label: 'تفسير', elements: [
    { type: 'path', d: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z' },
    { type: 'path', d: 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z' },
  ]},
  { key: 'bookmark', label: 'حفظ', elements: [
    { type: 'path', d: 'm19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' },
  ]},
  { key: 'copy', label: 'نسخ', elements: [
    { type: 'rect', x: 9, y: 9, width: 13, height: 13, rx: 2 },
    { type: 'path', d: 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' },
  ]},
  { key: 'share', label: 'مشاركة', elements: [
    { type: 'circle', cx: 18, cy: 5, r: 3 },
    { type: 'circle', cx: 6, cy: 12, r: 3 },
    { type: 'circle', cx: 18, cy: 19, r: 3 },
    { type: 'path', d: 'm8.59 13.51 6.83 3.98' },
    { type: 'path', d: 'm15.41 6.51-6.82 3.98' },
  ]},
  { key: 'wordByWord', label: 'كلمة', elements: [
    { type: 'path', d: 'M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2' },
    { type: 'path', d: 'M9 20h6' },
    { type: 'path', d: 'M12 4v16' },
  ]},
];

export function AyahPopup({ selection, x, y, onAction, onDismiss }: AyahPopupProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const screenWidth = Dimensions.get('window').width;
  const showBelow = y < POPUP_HEIGHT + TAIL_SIZE + 20;
  const top = showBelow ? y + TAIL_SIZE + 8 : y - POPUP_HEIGHT - TAIL_SIZE - 8;
  const clampedLeft = Math.max(8, Math.min(x - POPUP_WIDTH / 2, screenWidth - POPUP_WIDTH - 8));
  const tailLeft = Math.max(20, Math.min(x - clampedLeft - TAIL_SIZE / 2, POPUP_WIDTH - 32));

  return (
    <View style={[styles.container, { top, left: clampedLeft }]} pointerEvents="box-none">
      <View style={styles.popup}>
        {/* Under forceRTL, flexDirection:'row' renders right-to-left.
            First JSX child → rightmost. So: close → sep → actions.
            Visual: [× (right)] [|] [play] ... [word (left)] */}
        <Pressable onPress={onDismiss} accessibilityRole="button" accessibilityLabel="إغلاق" hitSlop={6}>
          {({ pressed }) => (
            <View style={[styles.close, pressed && styles.closePressed]}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                stroke={theme.semantic.fgMuted} strokeWidth={2} strokeLinecap="round">
                <Path d="M18 6L6 18" />
                <Path d="M6 6l12 12" />
              </Svg>
            </View>
          )}
        </Pressable>
        <View style={styles.sep} />
        {ACTIONS.map((a) => (
          <Pressable
            key={a.key}
            onPress={() => onAction(a.key, selection)}
            accessibilityRole="button"
            accessibilityLabel={a.label}
          >
            {({ pressed }) => (
              <View style={[styles.act, pressed && styles.actPressed]}>
                <Svg width={20} height={20} viewBox="0 0 24 24"
                  fill={a.primary ? theme.semantic.primary : 'none'}
                  stroke={a.primary ? 'none' : theme.semantic.fg}
                  strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                  {a.elements.map((el, i) => {
                    if (el.type === 'path') return <Path key={i} d={el.d} />;
                    if (el.type === 'circle') return <Circle key={i} cx={el.cx} cy={el.cy} r={el.r} />;
                    return <Rect key={i} x={el.x} y={el.y} width={el.width} height={el.height} rx={el.rx} />;
                  })}
                </Svg>
                <Text style={styles.actLabel}>{a.label}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>
      <View
        style={[
          styles.tailBase,
          showBelow ? styles.tailUp : styles.tailDown,
          { left: tailLeft },
        ]}
      />
    </View>
  );
}

function createStyles(theme: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      zIndex: 100,
      width: POPUP_WIDTH,
    },
    popup: {
      flexDirection: 'row',
      alignItems: 'stretch',
      backgroundColor: theme.semantic.bgRaised,
      borderWidth: 1,
      borderColor: theme.semantic.borderGold,
      borderRadius: theme.radii.md,
      padding: 6,
      gap: 2,
      ...theme.elevation.shadow3,
    },
    act: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 8,
      paddingBottom: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radii.sm,
      gap: 4,
      minWidth: 48,
    },
    actPressed: {
      backgroundColor: theme.semantic.primaryTint,
    },
    actLabel: {
      fontFamily: theme.fonts.quran,
      fontSize: 11,
      fontWeight: '500',
      color: theme.semantic.fgMuted,
      lineHeight: 13,
    },
    sep: {
      width: 1,
      backgroundColor: theme.semantic.border,
      marginHorizontal: 2,
      marginVertical: 6,
    },
    close: {
      flex: 1,
      width: 42,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radii.sm,
    },
    closePressed: {
      backgroundColor: theme.semantic.bgSunken,
    },
    // Downward tail — a rotated square with two borders, matching the design's CSS pseudo-element.
    tailBase: {
      position: 'absolute',
      width: TAIL_SIZE,
      height: TAIL_SIZE,
      backgroundColor: theme.semantic.bgRaised,
      borderColor: theme.semantic.borderGold,
      transform: [{ rotate: '45deg' }],
    },
    tailDown: {
      bottom: -TAIL_SIZE / 2 + 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
    },
    tailUp: {
      top: -TAIL_SIZE / 2 + 1,
      borderLeftWidth: 1,
      borderTopWidth: 1,
    },
  });
}
