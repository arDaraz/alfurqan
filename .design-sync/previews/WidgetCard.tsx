import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NumeralText, WidgetCard } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#F5EEDB', padding: 12 } as const;

const styles = StyleSheet.create({
  body: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 19,
    lineHeight: 30,
    color: '#0E2724',
    marginTop: 10,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  meta: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 13,
    lineHeight: 20,
    color: '#4A635F',
    marginTop: 6,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  numeral: { fontFamily: 'Amiri' },
  notice: {
    fontFamily: 'KFGQPC-Uthmani',
    fontSize: 15,
    lineHeight: 24,
    color: '#4A635F',
    marginTop: 8,
    textAlign: 'left',
    writingDirection: 'rtl',
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EBE2C9',
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: { height: '100%', width: '62%', backgroundColor: '#0B5D53' },
});

export function DailyWird() {
  return (
    <View style={PAPER}>
      <WidgetCard label="الورد اليومي">
        <NumeralText style={styles.body} numeralStyle={styles.numeral}>
          ٥ صفحات من أصل ٨
        </NumeralText>
        <View style={styles.track}>
          <View style={styles.fill} />
        </View>
      </WidgetCard>
    </View>
  );
}

export function Tappable() {
  return (
    <View style={PAPER}>
      <WidgetCard label="خطة الحفظ" onPress={noop} accessibilityLabel="خطة الحفظ">
        <NumeralText style={styles.body} numeralStyle={styles.numeral}>
          سورة الملك · الآية ١٢
        </NumeralText>
        <NumeralText style={styles.meta} numeralStyle={styles.numeral}>
          المراجعة القادمة بعد ٣ أيام
        </NumeralText>
      </WidgetCard>
    </View>
  );
}

export function LocationNotice() {
  return (
    <View style={PAPER}>
      <WidgetCard label="الصلاة القادمة">
        <Text style={styles.notice}>فعّل خدمة الموقع لعرض مواقيت الصلاة</Text>
      </WidgetCard>
    </View>
  );
}
