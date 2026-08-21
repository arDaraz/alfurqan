import React from 'react';
import { View, Text } from 'react-native';
import { OrnamentDivider } from 'alfurqan';

export function Tiers() {
  const tiers: Array<{ tier: 'full' | 'medium' | 'compact'; label: string }> = [
    { tier: 'full', label: 'full - 560px, opacity 1' },
    { tier: 'medium', label: 'medium - 280px, opacity 0.55' },
    { tier: 'compact', label: 'compact - 200px, opacity 0.4' },
  ];
  return (
    <View style={{ width: 600, backgroundColor: '#F5EEDB', paddingVertical: 24, gap: 22, alignItems: 'center' }}>
      {tiers.map((row) => (
        <View key={row.tier} style={{ alignItems: 'center', gap: 6 }}>
          <OrnamentDivider tier={row.tier} />
          <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: '#4A635F' }}>
            {row.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function SectionBreak() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingVertical: 24, alignItems: 'center' }}>
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 22, color: '#0E2724', marginBottom: 12 }}>
        تصفح السور
      </Text>
      <OrnamentDivider tier="medium" color="#B8923F" />
      <Text
        style={{
          fontFamily: 'KFGQPC-Uthmani',
          fontSize: 17,
          color: '#4A635F',
          textAlign: 'center',
          marginTop: 12,
          paddingHorizontal: 32,
        }}
      >
        ابحث عن سورة أو آية أو رقم صفحة
      </Text>
    </View>
  );
}

export function OnInk() {
  return (
    <View style={{ width: 600, backgroundColor: '#0E2724', paddingVertical: 28, gap: 22, alignItems: 'center' }}>
      <OrnamentDivider tier="full" darkMode />
      <OrnamentDivider tier="medium" darkMode />
      <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 3, color: '#8A9F9B' }}>
        D A R K   M O D E   G O L D
      </Text>
    </View>
  );
}

export function WidthOverride() {
  return (
    <View style={{ width: 380, backgroundColor: '#FBF6EA', paddingVertical: 22, gap: 18, alignItems: 'center' }}>
      <OrnamentDivider width={340} />
      <OrnamentDivider width={240} />
      <OrnamentDivider width={160} />
      <Text style={{ fontFamily: 'Manrope', fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: '#4A635F' }}>
        width override - 340 / 240 / 160, hairlines drop below 200
      </Text>
    </View>
  );
}
