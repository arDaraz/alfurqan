import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Pill, SettingsGroup, SettingsRow, Toggle } from 'alfurqan';

const noop = () => {};
const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' } as const;
const STROKE = { stroke: '#0B5D53', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export function WithPill() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
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

export function WithToggle() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="التطبيق">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Path
                d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"
                {...STROKE}
              />
            </Svg>
          }
          label="تذكير يومي"
          value="بعد صلاة الفجر"
          trailing={<Toggle value onValueChange={noop} accessibilityLabel="تذكير يومي" />}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Rect x={9} y={3} width={6} height={12} rx={3} {...STROKE} />
              <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" {...STROKE} />
            </Svg>
          }
          label="التسميع"
          value="مُعطّل"
          trailing={<Toggle value={false} onValueChange={noop} accessibilityLabel="التسميع" />}
        />
      </SettingsGroup>
    </View>
  );
}

export function NavigationRows() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="التطبيق">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Circle cx={12} cy={12} r={9} {...STROKE} />
              <Path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" {...STROKE} />
            </Svg>
          }
          label="اللغة"
          value="العربية"
          onPress={noop}
        />
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Circle cx={12} cy={12} r={9} {...STROKE} />
              <Path d="M12 8v4M12 16h.01" {...STROKE} />
            </Svg>
          }
          label="مظهر التطبيق"
          value="النظام"
          onPress={noop}
        />
        <SettingsRow
          isLast
          icon={
            <Svg {...ICON}>
              <Circle cx={12} cy={12} r={10} {...STROKE} />
              <Path d="M12 8v4M12 16h.01" {...STROKE} />
            </Svg>
          }
          label="حول الفرقان"
          value="الإصدار 1.0.0"
          onPress={noop}
        />
      </SettingsGroup>
    </View>
  );
}

export function LabelOnly() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="الصوت">
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
          onPress={noop}
        />
      </SettingsGroup>
    </View>
  );
}
