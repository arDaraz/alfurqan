import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AyahPopup } from 'alfurqan';

const noop = () => {};

const alKahf10 = { startSurah: 18, startAyah: 10, endSurah: 18, endAyah: 10 };
const yaSinRange = { startSurah: 36, startAyah: 1, endSurah: 36, endAyah: 5 };

const styles = StyleSheet.create({
  page: {
    width: 396,
    height: 320,
    position: 'relative',
    backgroundColor: '#F5EEDB',
    overflow: 'hidden',
  },
  line: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 21,
    lineHeight: 46,
    color: '#0E2724',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  selected: { backgroundColor: '#0B5D5324' },
});

export function OverSelectedAyah() {
  return (
    <View style={styles.page}>
      <View style={{ paddingTop: 22, paddingHorizontal: 18 }}>
        <Text style={styles.line}>وَكَذَٰلِكَ بَعَثْنَٰهُمْ لِيَتَسَآءَلُوا۟ بَيْنَهُمْ</Text>
        <Text style={[styles.line, styles.selected, { marginTop: 142 }]}>
          إِذْ أَوَى ٱلْفِتْيَةُ إِلَى ٱلْكَهْفِ فَقَالُوا۟ رَبَّنَآ ءَاتِنَا مِن لَّدُنكَ رَحْمَةً
        </Text>
      </View>
      <AyahPopup selection={alKahf10} x={198} y={200} onAction={noop} onDismiss={noop} />
    </View>
  );
}

export function NearPageTop() {
  return (
    <View style={styles.page}>
      <View style={{ paddingTop: 18, paddingHorizontal: 18 }}>
        <Text style={[styles.line, styles.selected]}>يسٓ وَٱلْقُرْءَانِ ٱلْحَكِيمِ</Text>
        <Text style={[styles.line, { marginTop: 110 }]}>
          إِنَّكَ لَمِنَ ٱلْمُرْسَلِينَ عَلَىٰ صِرَٰطٍ مُّسْتَقِيمٍ
        </Text>
      </View>
      <AyahPopup selection={yaSinRange} x={198} y={58} onAction={noop} onDismiss={noop} />
    </View>
  );
}
