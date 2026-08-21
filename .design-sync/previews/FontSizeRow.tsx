import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { FontSizeRow, Pill, SettingsGroup, SettingsRow } from 'alfurqan';

const noop = () => {};
const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' } as const;
const STROKE = { stroke: '#0B5D53', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function InReadingGroup() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
        <FontSizeRow label="حجم النص القرآني" value={0.58} onChange={noop} />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Path d="M4 7V5h16v2" {...STROKE} />
              <Path d="M9 19h6" {...STROKE} />
              <Path d="M12 5v14" {...STROKE} />
            </Svg>
          }
          label="نسخة المصحف"
          value="مصحف المدينة النبوية"
          onPress={noop}
          trailing={<Pill label="تغيير" onPress={noop} />}
        />
      </SettingsGroup>
    </View>
  );
}

export function Smallest() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
        <FontSizeRow label="حجم النص القرآني" value={0.08} onChange={noop} />
      </SettingsGroup>
    </View>
  );
}

export function Largest() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
        <FontSizeRow label="حجم النص القرآني" value={0.96} onChange={noop} />
      </SettingsGroup>
    </View>
  );
}
