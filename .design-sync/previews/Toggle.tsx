import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SettingsGroup, SettingsRow, Toggle } from 'alfurqan';

const noop = () => {};

export function On() {
  return <Toggle value onValueChange={noop} accessibilityLabel="القراءة الليلية" />;
}

export function Off() {
  return <Toggle value={false} onValueChange={noop} accessibilityLabel="القراءة الليلية" />;
}

export function InSettingsRow() {
  return (
    <View style={{ width: 360 }}>
      <SettingsGroup label="القراءة">
        <SettingsRow
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                stroke="#0B5D53"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          }
          label="القراءة الليلية"
          value="دافئ"
          isLast
          trailing={<Toggle value onValueChange={noop} accessibilityLabel="القراءة الليلية" />}
        />
      </SettingsGroup>
    </View>
  );
}
