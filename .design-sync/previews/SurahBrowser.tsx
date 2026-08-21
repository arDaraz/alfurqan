import React from 'react';
import { View } from 'react-native';
import { SearchInput, SurahBrowser } from 'alfurqan';

// The database answers empty on the web, so a short frame keeps the rowless
// list from dominating the card.
const FRAME = { width: 390, height: 300, backgroundColor: '#EBE2C9', paddingTop: 12 } as const;

export function Resting() {
  return (
    <View style={FRAME}>
      <SurahBrowser />
    </View>
  );
}

export function UnderSearchField() {
  const [query, setQuery] = React.useState('');
  return (
    <View style={FRAME}>
      <View style={{ paddingBottom: 12 }}>
        <SearchInput value={query} onChangeText={setQuery} />
      </View>
      <SurahBrowser />
    </View>
  );
}
