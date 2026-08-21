import React from 'react';
import { View } from 'react-native';
import { BookmarkCategorySheet } from 'alfurqan';

const noop = () => {};

const PAPER = {
  width: 380,
  height: 320,
  position: 'relative',
  backgroundColor: '#F5EEDB',
  overflow: 'hidden',
} as const;

export function NewBookmark() {
  return (
    <View style={PAPER}>
      <BookmarkCategorySheet
        surahName="الكهف"
        ayahNumber={10}
        initialCategories={[]}
        onCommit={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function SavedForReading() {
  return (
    <View style={PAPER}>
      <BookmarkCategorySheet
        surahName="يس"
        ayahNumber={9}
        initialCategories={['reading']}
        onCommit={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function SavedForBoth() {
  return (
    <View style={PAPER}>
      <BookmarkCategorySheet
        surahName="البقرة"
        ayahNumber={255}
        initialCategories={['reading', 'recitation']}
        onCommit={noop}
        onDismiss={noop}
      />
    </View>
  );
}
