import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Pill, SettingsGroup, SettingsRow, Toggle } from 'alfurqan';

const noop = () => {};
const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' } as const;
const STROKE = { stroke: '#0B5D53', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function ReadingSection() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Path d="M4 7V5h16v2" {...STROKE} />
              <Path d="M9 19h6" {...STROKE} />
              <Path d="M12 5v14" {...STROKE} />
            </Svg>
          }
          label="خط المصحف"
          value="مصحف المدينة النبوية"
          onPress={noop}
          trailing={<Pill label="تغيير" />}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" {...STROKE} />
            </Svg>
          }
          label="القراءة الليلية"
          value="دافئ"
          trailing={<Toggle value onValueChange={noop} accessibilityLabel="القراءة الليلية" />}
        />
      </SettingsGroup>
    </View>
  );
}

export function AudioSection() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="الصوت">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Path d="M11 5 6 9H2v6h4l5 4V5Z" {...STROKE} />
              <Path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" {...STROKE} />
            </Svg>
          }
          label="القارئ"
          value="مشاري راشد العفاسي · 128kbps"
          onPress={noop}
          trailing={<Pill label="تغيير" />}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Path d="M12 3v11" {...STROKE} />
              <Path d="m7 9 5 5 5-5" {...STROKE} />
              <Path d="M5 19h14" {...STROKE} />
            </Svg>
          }
          label="التلاوات المحفوظة"
          value="٣ تلاوات · ١٢ ميجابايت"
          onPress={noop}
        />
      </SettingsGroup>
    </View>
  );
}
