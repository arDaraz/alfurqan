import React from 'react';
import { View } from 'react-native';
import { PlayerSheet, useRecitationStore } from 'alfurqan';

const noop = () => {};

// The sheet reads playback from the recitation store, which starts idle, so
// each cell seeds a session before it renders.
const session = {
  range: { surah: 18, startAyah: 10, stopAyah: 26, trigger: 'toolbar' as const },
  currentAyah: 12,
};

const FRAME = { width: 390, height: 800, backgroundColor: '#F5EEDB' } as const;

export function Playing() {
  useRecitationStore.setState({ ...session, state: 'playing', positionSeconds: 12, durationSeconds: 34 });
  return (
    <View style={FRAME}>
      <PlayerSheet visible onClose={noop} />
    </View>
  );
}

export function Paused() {
  useRecitationStore.setState({ ...session, state: 'paused', positionSeconds: 21, durationSeconds: 34 });
  return (
    <View style={FRAME}>
      <PlayerSheet visible onClose={noop} />
    </View>
  );
}

export function Idle() {
  useRecitationStore.setState({
    range: null,
    currentAyah: null,
    state: 'idle',
    positionSeconds: 0,
    durationSeconds: 0,
  });
  return (
    <View style={FRAME}>
      <PlayerSheet visible onClose={noop} />
    </View>
  );
}
