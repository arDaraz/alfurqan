import React from 'react';
import { View, Text } from 'react-native';
import { LogoGlyph } from 'alfurqan';

export function Splash() {
  return (
    <View style={{ width: 380, backgroundColor: '#0E2724', paddingVertical: 40, alignItems: 'center', gap: 14 }}>
      <LogoGlyph size={136} bg="#0E2724" gold="#B8923F" goldSoft="#E2C480" />
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 34, color: '#F5EEDB' }}>الفرقان</Text>
      <View style={{ width: 64, height: 1, backgroundColor: '#B8923F', opacity: 0.5 }} />
      <Text style={{ fontFamily: 'Manrope', fontSize: 13, color: '#8A9F9B', letterSpacing: 0.4 }}>
        Recite. We Listen.
      </Text>
    </View>
  );
}

export function Onboarding() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingVertical: 32, alignItems: 'center', gap: 18 }}>
      <LogoGlyph size={140} bg="#0B5D53" gold="#E2C480" goldSoft="#E2C480" />
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 24, color: '#0E2724' }}>مرحبًا بك في الفرقان</Text>
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 17, color: '#4A635F', textAlign: 'center', paddingHorizontal: 40 }}>
        اقرأ المصحف واستمع لتلاوتك
      </Text>
    </View>
  );
}

export function BrandBar() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#FBF6EA',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#0E27241A',
        flexDirection: 'row-reverse',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <LogoGlyph size={36} bg="#0B5D53" gold="#E2C480" goldSoft="#E2C480" />
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 21, color: '#0E2724' }}>الفرقان</Text>
    </View>
  );
}

export function SizeScale() {
  const sizes = [24, 40, 72, 120];
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#F5EEDB',
        padding: 20,
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-around',
      }}
    >
      {sizes.map((size) => (
        <View key={size} style={{ alignItems: 'center', gap: 8 }}>
          <LogoGlyph size={size} />
          <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', color: '#4A635F' }}>{size}</Text>
        </View>
      ))}
    </View>
  );
}
