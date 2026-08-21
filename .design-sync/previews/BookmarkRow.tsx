import React from 'react';
import { View } from 'react-native';
import { BookmarkRow } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', paddingVertical: 16 } as const;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const savedToday = Date.now() - 3 * HOUR;
const savedYesterday = Date.now() - 30 * HOUR;
const savedLastWeek = Date.now() - 9 * DAY;

export function Reading() {
  return (
    <View style={PAPER}>
      <BookmarkRow
        surahNumber={18}
        ayahNumber={10}
        surahName="الكهف"
        pageNumber={294}
        juzNumber={15}
        category="reading"
        createdAt={savedToday}
        onPress={noop}
        onDelete={noop}
      />
    </View>
  );
}

export function Memorization() {
  return (
    <View style={PAPER}>
      <BookmarkRow
        surahNumber={2}
        ayahNumber={255}
        surahName="البقرة"
        pageNumber={42}
        juzNumber={3}
        category="recitation"
        createdAt={savedYesterday}
        onPress={noop}
        onDelete={noop}
      />
    </View>
  );
}

export function SavedList() {
  return (
    <View style={PAPER}>
      <BookmarkRow
        surahNumber={67}
        ayahNumber={1}
        surahName="الملك"
        pageNumber={562}
        juzNumber={29}
        category="recitation"
        createdAt={savedToday}
        onPress={noop}
        onDelete={noop}
      />
      <BookmarkRow
        surahNumber={18}
        ayahNumber={10}
        surahName="الكهف"
        pageNumber={294}
        juzNumber={15}
        category="reading"
        createdAt={savedYesterday}
        onPress={noop}
        onDelete={noop}
      />
      <BookmarkRow
        surahNumber={36}
        ayahNumber={58}
        surahName="يس"
        pageNumber={444}
        juzNumber={23}
        category="reading"
        createdAt={savedLastWeek}
        onPress={noop}
        onDelete={noop}
      />
    </View>
  );
}
