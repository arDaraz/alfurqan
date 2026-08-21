import React from 'react';
import { View } from 'react-native';
import { SearchInput } from 'alfurqan';

const noop = () => {};

const PAPER = { width: 380, backgroundColor: '#EBE2C9', paddingVertical: 14 } as const;

function Field({ initial, onFiltersPress }: { initial: string; onFiltersPress?: () => void }) {
  const [value, setValue] = React.useState(initial);
  return (
    <View style={PAPER}>
      <SearchInput value={value} onChangeText={setValue} onFiltersPress={onFiltersPress} />
    </View>
  );
}

export function Empty() {
  return <Field initial="" />;
}

export function Typed() {
  return <Field initial="الرحمن" />;
}

export function TypedWithFilters() {
  return <Field initial="سورة الكهف" onFiltersPress={noop} />;
}

export function FiltersOnly() {
  return <Field initial="" onFiltersPress={noop} />;
}
