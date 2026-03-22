import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function SurahScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF8F2' }}>
      <Text style={{ fontSize: 18, color: '#1A1A2E' }}>Surah {id}</Text>
    </View>
  );
}
