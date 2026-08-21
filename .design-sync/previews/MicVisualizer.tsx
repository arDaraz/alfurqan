import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { MicVisualizer } from 'alfurqan';

export function Default() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingVertical: 24 }}>
      <MicVisualizer />
    </View>
  );
}

export function ListeningFooter() {
  return (
    <View
      style={{
        width: 380,
        backgroundColor: '#FBF6EA',
        borderTopWidth: 1,
        borderTopColor: '#0E27241A',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
      }}
    >
      <MicVisualizer />
      <View style={{ alignItems: 'center', marginTop: 14 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: '#A14444',
            borderWidth: 3,
            borderColor: '#F5EEDB',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Rect x={9} y={3} width={6} height={12} rx={3} stroke="#FBF6EA" strokeWidth={1.75} />
            <Path
              d="M5 11a7 7 0 0 0 14 0M12 18v3"
              stroke="#FBF6EA"
              strokeWidth={1.75}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text style={{ marginTop: 12, fontFamily: 'Amiri', fontSize: 16, color: '#4A635F' }}>
          يستمع
        </Text>
      </View>
    </View>
  );
}
