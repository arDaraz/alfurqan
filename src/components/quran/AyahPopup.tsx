import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AyahSelection, AyahActionType } from '../../data/types';

interface AyahPopupProps {
  selection: AyahSelection;
  x: number;
  y: number;
  onAction: (action: AyahActionType, selection: AyahSelection) => void;
  onDismiss: () => void;
}

const POPUP_HEIGHT = 72;
const POPUP_WIDTH = 280;
const ARROW_SIZE = 8;

const actions: Array<{ key: AyahActionType; icon: string; label: string }> = [
  { key: 'play', icon: 'play', label: 'تشغيل' },
  { key: 'tafsir', icon: 'book-open-variant', label: 'تفسير' },
  { key: 'bookmark', icon: 'bookmark-outline', label: 'حفظ' },
  { key: 'copy', icon: 'content-copy', label: 'نسخ' },
  { key: 'share', icon: 'share-variant', label: 'مشاركة' },
  { key: 'wordByWord', icon: 'abjad-arabic', label: 'كلمة' },
];

export function AyahPopup({ selection, x, y, onAction, onDismiss }: AyahPopupProps) {
  const screenWidth = Dimensions.get('window').width;
  const showBelow = y < POPUP_HEIGHT + ARROW_SIZE + 20;
  const top = showBelow ? y + ARROW_SIZE + 10 : y - POPUP_HEIGHT - ARROW_SIZE - 10;
  const clampedLeft = Math.max(8, Math.min(x - POPUP_WIDTH / 2, screenWidth - POPUP_WIDTH - 8));

  return (
    <View style={[styles.container, { top, left: clampedLeft }]} pointerEvents="box-none">
      {/* Arrow */}
      <View style={[
        styles.arrow,
        showBelow ? styles.arrowUp : styles.arrowDown,
        { left: Math.max(20, x - clampedLeft - ARROW_SIZE) },
      ]} />
      {/* Actions row */}
      <View style={styles.popup}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            style={styles.actionBtn}
            onPress={() => onAction(a.key, selection)}
          >
            <MaterialCommunityIcons name={a.icon as any} size={20} color="#5C4033" />
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  popup: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#B8965A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 9,
    color: '#5C4033',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowUp: {
    top: -ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: '#B8965A',
  },
  arrowDown: {
    bottom: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderTopColor: '#B8965A',
  },
});
