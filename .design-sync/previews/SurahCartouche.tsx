import React from 'react';
import { View, Text } from 'react-native';
import { SurahCartouche } from 'alfurqan';

function Sarlawh({
  title,
  width = 380,
  color = '#B8923F',
  fillColor = '#F5EEDB',
  textColor = '#0E2724',
}: {
  title: string;
  width?: number;
  color?: string;
  fillColor?: string;
  textColor?: string;
}) {
  const height = (width * 80) / 440;
  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <SurahCartouche width={width} height={height} color={color} fillColor={fillColor} />
      </View>
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: height * 0.42, color: textColor }}>{title}</Text>
    </View>
  );
}

export function MushafHeader() {
  return (
    <View style={{ width: 420, backgroundColor: '#F5EEDB', paddingVertical: 24, alignItems: 'center' }}>
      <Sarlawh title="سُورَةُ الْبَقَرَة" />
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 24, color: '#0B5D53', marginTop: 20 }}>
        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
      </Text>
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 26, color: '#0E2724', marginTop: 14, textAlign: 'center' }}>
        الم
      </Text>
    </View>
  );
}

export function Widths() {
  return (
    <View style={{ width: 420, backgroundColor: '#FBF6EA', paddingVertical: 22, gap: 18, alignItems: 'center' }}>
      <Sarlawh title="سُورَةُ الْفَاتِحَة" width={380} />
      <Sarlawh title="سُورَةُ يس" width={280} fillColor="#FBF6EA" />
      <Sarlawh title="سُورَةُ النَّاس" width={200} fillColor="#FBF6EA" />
    </View>
  );
}

export function OnInk() {
  return (
    <View style={{ width: 420, backgroundColor: '#0E2724', paddingVertical: 28, alignItems: 'center', gap: 16 }}>
      <Sarlawh
        title="سُورَةُ الْفُرْقَان"
        width={380}
        color="#E2C480"
        fillColor="#0E2724"
        textColor="#F5EEDB"
      />
      <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 3, color: '#8A9F9B' }}>
        N I G H T   R E A D I N G
      </Text>
    </View>
  );
}
