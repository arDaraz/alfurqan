import React from 'react';
import { View } from 'react-native';
import { TabBar } from 'alfurqan';

const ROUTES = [
  { key: 'index-0', name: 'index' },
  { key: 'search-1', name: 'search' },
  { key: 'bookmarks-2', name: 'bookmarks' },
  { key: 'settings-3', name: 'settings' },
];

const DESCRIPTORS = {
  'index-0': { options: { title: 'الرئيسية' } },
  'search-1': { options: { title: 'البحث' } },
  'bookmarks-2': { options: { title: 'العلامات' } },
  'settings-3': { options: { title: 'الملف الشخصي' } },
};

const NAVIGATION = {
  navigate: () => {},
  emit: () => ({ defaultPrevented: false }),
};

const INSETS = { top: 47, right: 0, bottom: 34, left: 0 };

// The FAB floats 22pt above the bar, so the wrapper leaves room over it.
const SCREEN_FOOT = {
  width: 390,
  paddingTop: 44,
  backgroundColor: '#F5EEDB',
  justifyContent: 'flex-end',
} as const;

function Bar({ index }: { index: number }) {
  return (
    <View style={SCREEN_FOOT}>
      <TabBar
        state={{ index, routes: ROUTES }}
        descriptors={DESCRIPTORS}
        navigation={NAVIGATION}
        insets={INSETS}
      />
    </View>
  );
}

export function HomeSelected() {
  return <Bar index={0} />;
}

export function SearchSelected() {
  return <Bar index={1} />;
}

export function ProfileSelected() {
  return <Bar index={3} />;
}
