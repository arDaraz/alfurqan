import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NumeralText, WidgetCard } from 'alfurqan';

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

const styles = StyleSheet.create({
  numeral: { fontFamily: 'Amiri' },
  count: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 26,
    lineHeight: 40,
    color: '#0B5D53',
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  body: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 19,
    lineHeight: 30,
    color: '#0E2724',
    marginTop: 6,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  caption: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 13,
    lineHeight: 20,
    color: '#8A9F9B',
    marginTop: 6,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  row: {
    direction: 'rtl',
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  prayer: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 15,
    lineHeight: 24,
    color: '#4A635F',
    writingDirection: 'rtl',
  },
  legend: {
    fontFamily: 'Manrope',
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 1.8,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#8A9F9B',
    marginTop: 12,
  },
});

export function Counts() {
  return (
    <View style={PAPER}>
      <WidgetCard label="الأرقام داخل الجُمل">
        <NumeralText style={styles.count} numeralStyle={styles.numeral}>
          ٢٨٦ آية
        </NumeralText>
        <NumeralText style={styles.body} numeralStyle={styles.numeral}>
          الجزء ١٤ من ٣٠
        </NumeralText>
        <NumeralText style={styles.caption} numeralStyle={styles.numeral}>
          أطول تتابع ٤١ يومًا
        </NumeralText>
      </WidgetCard>
    </View>
  );
}

export function Clock() {
  return (
    <View style={PAPER}>
      <WidgetCard label="مواقيت اليوم">
        <View style={styles.row}>
          <NumeralText style={styles.prayer} numeralStyle={styles.numeral}>
            الفجر ٤:٤٨
          </NumeralText>
          <NumeralText style={styles.prayer} numeralStyle={styles.numeral}>
            الظهر ١٢:٠٦
          </NumeralText>
          <NumeralText style={styles.prayer} numeralStyle={styles.numeral}>
            المغرب ١٨:٣٢
          </NumeralText>
        </View>
      </WidgetCard>
    </View>
  );
}

export function AgainstQuranFont() {
  return (
    <View style={PAPER}>
      <WidgetCard label="الفرق بين الخطين">
        <NumeralText style={styles.legend}>WITH NUMERALSTYLE · AMIRI</NumeralText>
        <NumeralText style={styles.body} numeralStyle={styles.numeral}>
          صفحة ٢٥٥ · الجزء ٣
        </NumeralText>
        <NumeralText style={styles.legend}>WITHOUT · QURAN FONT ORNAMENTS</NumeralText>
        <NumeralText style={styles.body}>صفحة ٢٥٥ · الجزء ٣</NumeralText>
      </WidgetCard>
    </View>
  );
}
