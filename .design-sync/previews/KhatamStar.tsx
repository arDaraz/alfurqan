import React from 'react';
import { View, Text } from 'react-native';
import { KhatamStar } from 'alfurqan';

function Badge({
  number,
  active = false,
  size = 44,
}: {
  number: string;
  active?: boolean;
  size?: number;
}) {
  const stroke = active ? '#0B5D53' : '#B8923F';
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <KhatamStar size={size} color={stroke} fill="#F5EEDB" strokeWidth={1} />
      </View>
      <Text style={{ fontFamily: 'Manrope', fontSize: size * 0.3, fontWeight: '600', color: stroke }}>
        {number}
      </Text>
    </View>
  );
}

export function SurahBadges() {
  const surahs = [
    { number: '1', name: 'الفاتحة' },
    { number: '2', name: 'البقرة' },
    { number: '36', name: 'يس' },
    { number: '114', name: 'الناس' },
  ];
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', padding: 18, gap: 14 }}>
      {surahs.map((surah) => (
        <View key={surah.number} style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 14 }}>
          <Badge number={surah.number} />
          <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 19, color: '#0E2724' }}>{surah.name}</Text>
        </View>
      ))}
    </View>
  );
}

export function ActiveAndRest() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#F5EEDB',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Badge number="18" size={72} />
        <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#4A635F' }}>
          REST
        </Text>
      </View>
      <View
        style={{
          alignItems: 'center',
          gap: 10,
          backgroundColor: '#0B5D531A',
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Badge number="18" size={72} active />
        <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#0B5D53' }}>
          ACTIVE
        </Text>
      </View>
    </View>
  );
}

export function OutlineAndFilled() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#EBE2C9',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: 10 }}>
        <KhatamStar size={120} strokeWidth={1.4} />
        <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#4A635F' }}>
          OUTLINE
        </Text>
      </View>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <KhatamStar size={120} strokeWidth={1} fill="#FBF6EA" />
        <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#4A635F' }}>
          FILLED
        </Text>
      </View>
    </View>
  );
}

export function OnInk() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#0E2724',
        padding: 24,
        alignItems: 'center',
        gap: 14,
      }}
    >
      <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ position: 'absolute' }}>
          <KhatamStar size={120} color="#E2C480" strokeWidth={1.2} fill="#0B5D53" />
        </View>
        <Text style={{ fontFamily: 'Amiri', fontSize: 32, lineHeight: 40, color: '#E2C480' }}>٣٠</Text>
      </View>
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 17, color: '#8A9F9B' }}>الجزء الثلاثون</Text>
    </View>
  );
}
