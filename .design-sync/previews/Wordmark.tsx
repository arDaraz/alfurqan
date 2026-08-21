import React from 'react';
import { View, Text } from 'react-native';
import { Wordmark } from 'alfurqan';

export function Default() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', padding: 24, alignItems: 'center' }}>
      <Wordmark width={240} height={64} />
    </View>
  );
}

export function Large() {
  return (
    <View style={{ width: 420, backgroundColor: '#F5EEDB', padding: 24, alignItems: 'center' }}>
      <Wordmark width={360} height={96} />
    </View>
  );
}

export function OnInk() {
  return (
    <View style={{ width: 420, backgroundColor: '#0E2724', padding: 28, alignItems: 'center' }}>
      <Wordmark
        width={360}
        height={96}
        inkColor="#F5EEDB"
        mutedColor="#8A9F9B"
        bg="#0B5D53"
        gold="#E2C480"
        goldSoft="#E2C480"
      />
    </View>
  );
}

export function AboutLockup() {
  return (
    <View
      style={{
        width: 420,
        backgroundColor: '#FBF6EA',
        paddingVertical: 30,
        paddingHorizontal: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#0E27241A',
        borderRadius: 16,
      }}
    >
      <Wordmark width={300} height={80} />
      <View style={{ width: 96, height: 1, backgroundColor: '#B8923F', opacity: 0.45, marginTop: 18 }} />
      <Text style={{ fontFamily: 'KFGQPC-Uthmani', fontSize: 20, color: '#0E2724', marginTop: 16 }}>
        مصحف الفرقان
      </Text>
      <Text style={{ fontFamily: 'Manrope', fontSize: 13, color: '#4A635F', marginTop: 8 }}>
        Recite. We Listen.
      </Text>
    </View>
  );
}
