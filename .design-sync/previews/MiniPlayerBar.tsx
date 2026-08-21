import React from 'react';
import { View } from 'react-native';
import { MiniPlayerBar, useRecitationStore } from 'alfurqan';

// The bar returns null while playback is idle, which is the store's starting
// value, so each cell seeds a session before it renders.
const session = {
  range: { surah: 18, startAyah: 10, stopAyah: 26, trigger: 'toolbar' as const },
  currentAyah: 12,
  durationSeconds: 34,
};

function withPlayback(state: 'playing' | 'paused' | 'loading' | 'error', extra: object = {}) {
  useRecitationStore.setState({ ...session, state, positionSeconds: 12, ...extra });
}

const PAPER = { width: 380, paddingVertical: 10, backgroundColor: '#F5EEDB' } as const;

export function Playing() {
  withPlayback('playing');
  return (
    <View style={PAPER}>
      <MiniPlayerBar />
    </View>
  );
}

export function Paused() {
  withPlayback('paused');
  return (
    <View style={PAPER}>
      <MiniPlayerBar />
    </View>
  );
}

export function Loading() {
  withPlayback('loading', { positionSeconds: 0, durationSeconds: 0 });
  return (
    <View style={PAPER}>
      <MiniPlayerBar />
    </View>
  );
}

export function PlaybackError() {
  withPlayback('error', { errorCategory: 'network', errorMessage: 'تعذّر تحميل التلاوة. تحقق من الاتصال.' });
  return (
    <View style={PAPER}>
      <MiniPlayerBar />
    </View>
  );
}
