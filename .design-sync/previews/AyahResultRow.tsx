import React from 'react';
import { View } from 'react-native';
import { AyahResultRow } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#EBE2C9', paddingVertical: 14 } as const;

// Al-Baqarah 2:53 - the ayah the word "الفرقان" comes from, and the one the
// app's own search test uses.
const alFurqan = {
  surahNumber: 2,
  ayahNumber: 53,
  textUthmani: 'وَإِذْ ءَاتَيْنَا مُوسَى ٱلْكِتَٰبَ وَٱلْفُرْقَانَ لَعَلَّكُمْ تَهْتَدُونَ',
  juzNumber: 1,
  pageNumber: 8,
};

const taha5 = {
  surahNumber: 20,
  ayahNumber: 5,
  textUthmani: 'ٱلرَّحْمَٰنُ عَلَى ٱلْعَرْشِ ٱسْتَوَىٰ',
  juzNumber: 16,
  pageNumber: 312,
};

const isra110 = {
  surahNumber: 17,
  ayahNumber: 110,
  textUthmani:
    'قُلِ ٱدْعُوا۟ ٱللَّهَ أَوِ ٱدْعُوا۟ ٱلرَّحْمَٰنَ أَيًّا مَّا تَدْعُوا۟ فَلَهُ ٱلْأَسْمَآءُ ٱلْحُسْنَىٰ',
  juzNumber: 15,
  pageNumber: 293,
};

const fatiha3 = {
  surahNumber: 1,
  ayahNumber: 3,
  textUthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  juzNumber: 1,
  pageNumber: 1,
};

export function Result() {
  return (
    <View style={PAPER}>
      <AyahResultRow
        result={alFurqan}
        surahNameArabic="البقرة"
        surahNameEnglish="Al-Baqarah"
        query="الفرقان"
        onPress={noop}
        onPlay={noop}
        onCopy={noop}
        onBookmark={noop}
      />
    </View>
  );
}

export function LongAyah() {
  return (
    <View style={PAPER}>
      <AyahResultRow
        result={isra110}
        surahNameArabic="الإسراء"
        surahNameEnglish="Al-Isra"
        query="الرحمن"
        onPress={noop}
        onPlay={noop}
        onCopy={noop}
        onBookmark={noop}
      />
    </View>
  );
}

export function ResultList() {
  return (
    <View style={PAPER}>
      <AyahResultRow
        result={taha5}
        surahNameArabic="طه"
        surahNameEnglish="Ta-Ha"
        query="الرحمن"
        onPress={noop}
        onPlay={noop}
        onCopy={noop}
        onBookmark={noop}
      />
      <AyahResultRow
        result={fatiha3}
        surahNameArabic="الفاتحة"
        surahNameEnglish="Al-Fatiha"
        query="الرحمن"
        onPress={noop}
        onPlay={noop}
        onCopy={noop}
        onBookmark={noop}
      />
      <AyahResultRow
        result={isra110}
        surahNameArabic="الإسراء"
        surahNameEnglish="Al-Isra"
        query="الرحمن"
        onPress={noop}
        onPlay={noop}
        onCopy={noop}
        onBookmark={noop}
      />
    </View>
  );
}
