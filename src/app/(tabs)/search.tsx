import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SearchScreen } from '../../components/search/SearchScreen';

export default function SearchRoute() {
  const params = useLocalSearchParams<{ q?: string }>();
  return <SearchScreen initialQuery={typeof params.q === 'string' ? params.q : undefined} />;
}
