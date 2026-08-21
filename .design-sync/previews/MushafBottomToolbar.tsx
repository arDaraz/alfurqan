import React from 'react';
import { View } from 'react-native';
import { MushafBottomToolbar } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, paddingVertical: 10, backgroundColor: '#F5EEDB' } as const;

export function Default() {
  return (
    <View style={PAPER}>
      <MushafBottomToolbar onPlayPress={noop} onInfoPress={noop} onBookmarkPress={noop} />
    </View>
  );
}

export function PageBookmarked() {
  return (
    <View style={PAPER}>
      <MushafBottomToolbar
        onPlayPress={noop}
        onInfoPress={noop}
        onBookmarkPress={noop}
        bookmarkActive
      />
    </View>
  );
}
