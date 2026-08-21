import React from 'react';
import { View, Text } from 'react-native';
import { AyahRosette } from 'alfurqan';

// KFGQPC-Uthmani wraps Arabic-Indic digits in its own ayah-marker ornament, so
// every numeral here takes Amiri, the family NumeralText uses for digit runs.
const NUMERAL_FONT = 'Amiri';

/**
 * A numbered ayah marker, the way a printed mushaf sets the number inside the
 * ornament. A disc in the page colour masks the centre dot so the numeral reads.
 */
function Marker({
  number,
  size,
  color = '#B8923F',
  paper = '#F5EEDB',
}: {
  number: string;
  size: number;
  color?: string;
  paper?: string;
}) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        <AyahRosette size={size} color={color} />
      </View>
      <View
        style={{
          position: 'absolute',
          width: size * 0.42,
          height: size * 0.42,
          borderRadius: size * 0.21,
          backgroundColor: paper,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            fontFamily: NUMERAL_FONT,
            fontSize: size * (number.length > 2 ? 0.27 : 0.4),
            lineHeight: size * 0.42,
            color,
          }}
        >
          {number}
        </Text>
      </View>
    </View>
  );
}

export function Variants() {
  const tiles: Array<{ variant: 'ayah' | 'inline' | 'compact'; px: string }> = [
    { variant: 'ayah', px: '32 px' },
    { variant: 'inline', px: '24 px' },
    { variant: 'compact', px: '18 px' },
  ];
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#F5EEDB',
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-around',
      }}
    >
      {tiles.map((tile) => (
        <View key={tile.variant} style={{ alignItems: 'center', gap: 10 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              backgroundColor: '#EBE2C9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AyahRosette variant={tile.variant} />
          </View>
          <Text style={{ fontFamily: 'Manrope', fontSize: 12, fontWeight: '700', color: '#0E2724' }}>
            {tile.variant}
          </Text>
          <Text style={{ fontFamily: 'Manrope', fontSize: 11, color: '#4A635F' }}>{tile.px}</Text>
        </View>
      ))}
    </View>
  );
}

export function NumberedMarkers() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#F5EEDB',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
      }}
    >
      <Marker number="٧" size={96} />
      <Marker number="٨٣" size={96} />
      <Marker number="٢٨٦" size={96} />
    </View>
  );
}

export function InVerseLine() {
  return (
    <View
      style={{
        width: 420,
        backgroundColor: '#FBF6EA',
        padding: 22,
        borderWidth: 1,
        borderColor: '#0E27241A',
        borderRadius: 12,
      }}
    >
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 15, color: '#4A635F', textAlign: 'center', marginBottom: 16 }}>
        سُورَةُ الْفَاتِحَة
      </Text>
      <View
        style={{
          flexDirection: 'row-reverse',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 24, color: '#0E2724', lineHeight: 46 }}>
          الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
        </Text>
        <Marker number="٢" size={48} paper="#FBF6EA" />
        <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 24, color: '#0E2724', lineHeight: 46 }}>
          الرَّحْمَٰنِ الرَّحِيمِ
        </Text>
        <Marker number="٣" size={48} paper="#FBF6EA" />
        <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 24, color: '#0E2724', lineHeight: 46 }}>
          مَالِكِ يَوْمِ الدِّينِ
        </Text>
        <Marker number="٤" size={48} paper="#FBF6EA" />
      </View>
    </View>
  );
}

export function OnInk() {
  return (
    <View style={{ width: 380, backgroundColor: '#0E2724', padding: 24, alignItems: 'center', gap: 16 }}>
      <Marker number="٢٥" size={96} color="#E2C480" paper="#0E2724" />
      <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 3, color: '#8A9F9B' }}>
        N I G H T   R E A D I N G
      </Text>
    </View>
  );
}
