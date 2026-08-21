import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Pill, SettingsGroup, SettingsRow } from 'alfurqan';

const noop = () => {};
const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' } as const;
const STROKE = { stroke: '#0B5D53', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function ChangeAction() {
  return <Pill label="تغيير" onPress={noop} />;
}

export function SensitivityValue() {
  return (
    <Pill
      label="قوي"
      withChevron={false}
      accessibilityLabel="حساسية التصحيح"
      onPress={noop}
    />
  );
}

export function InSettingsRows() {
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
          trailing={<Pill label="تغيير" onPress={noop} />}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Rect x={9} y={3} width={6} height={12} rx={3} {...STROKE} />
              <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...STROKE} />
            </Svg>
          }
          label="حساسية التصحيح"
          value="تنبّه لكل خطأ في التشكيل"
          trailing={
            <Pill
              label="قوي"
              withChevron={false}
              accessibilityLabel="حساسية التصحيح"
              onPress={noop}
            />
          }
        />
      </SettingsGroup>
    </View>
  );
}

export function MadhabChoice() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="الشاشة الرئيسية">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Path d="M4 19h16" {...STROKE} />
              <Path d="M7 19V9M12 19V5M17 19v-6" {...STROKE} />
            </Svg>
          }
          label="طريقة الحساب"
          value="Umm al-Qura"
          onPress={noop}
          trailing={<Pill label="تغيير" onPress={noop} />}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Circle cx={12} cy={12} r={9} {...STROKE} />
              <Path d="M12 7v5l3 2" {...STROKE} />
            </Svg>
          }
          label="المذهب في العصر"
          value="الحنفي"
          trailing={
            <Pill
              label="الحنفي"
              withChevron={false}
              accessibilityLabel="المذهب في العصر"
              onPress={noop}
            />
          }
        />
      </SettingsGroup>
    </View>
  );
}
