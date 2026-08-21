import React from 'react';
import { View } from 'react-native';
import { BookmarkSavedSnackbar } from 'alfurqan';

const noop = () => {};

const PAPER = {
  width: 380,
  height: 170,
  position: 'relative',
  backgroundColor: '#F5EEDB',
  overflow: 'hidden',
} as const;

export function SavedForReading() {
  return (
    <View style={PAPER}>
      <BookmarkSavedSnackbar
        surahName="الكهف"
        pageNumber={293}
        juzNumber={15}
        resultingCategories={['reading']}
        onUndo={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function SavedForBoth() {
  return (
    <View style={PAPER}>
      <BookmarkSavedSnackbar
        surahName="يس"
        pageNumber={440}
        juzNumber={22}
        resultingCategories={['reading', 'recitation']}
        onUndo={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function Removed() {
  return (
    <View style={PAPER}>
      <BookmarkSavedSnackbar
        surahName="البقرة"
        pageNumber={49}
        juzNumber={3}
        resultingCategories={[]}
        onUndo={noop}
        onDismiss={noop}
      />
    </View>
  );
}

export function Undone() {
  return (
    <View style={PAPER}>
      <BookmarkSavedSnackbar
        surahName="البقرة"
        pageNumber={49}
        juzNumber={3}
        resultingCategories={['reading']}
        undone
        onUndo={noop}
        onDismiss={noop}
      />
    </View>
  );
}
