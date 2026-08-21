import React from 'react';
import { View, Text } from 'react-native';
import { LoadingSkeleton } from 'alfurqan';

export function ReaderPlaceholder() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingBottom: 16 }}>
      <LoadingSkeleton />
    </View>
  );
}

export function UnderReaderHeader() {
  return (
    <View style={{ width: 380, backgroundColor: '#F5EEDB', paddingBottom: 16 }}>
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#0E27241A',
        }}
      >
        <Text style={{ fontFamily: 'Amiri-Bold', fontSize: 18, color: '#0E2724' }}>البقرة</Text>
        <Text style={{ fontFamily: 'Amiri', fontSize: 13, color: '#8A9F9B' }}>
          صفحة ٤٩ · حزب ٤
        </Text>
      </View>
      <LoadingSkeleton />
    </View>
  );
}
