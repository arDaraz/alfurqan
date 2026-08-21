import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NightReadingPicker, SettingsGroup, SettingsRow, Toggle } from 'alfurqan';

const noop = () => {};
const ICON = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none' } as const;
const STROKE = { stroke: '#0B5D53', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const LABELS = {
  classical: { title: 'المصحف الكلاسيكي', subtitle: 'أخضر عميق · حبر دافئ' },
  sepia: { title: 'مصباح سيبيا', subtitle: 'فحمي دافئ · عنبر' },
  'pure-ink': { title: 'حبر خالص', subtitle: 'أسود حالك · زخرفة أقل' },
  indigo: { title: 'ليل نيلي', subtitle: 'أزرق منتصف الليل · ضوء قمري' },
} as const;

export function InReadingGroup() {
  return (
    <View style={{ width: 380 }}>
      <SettingsGroup label="القراءة">
        <SettingsRow
          icon={
            <Svg {...ICON}>
              <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" {...STROKE} />
            </Svg>
          }
          label="القراءة الليلية"
          value="المصحف الكلاسيكي"
          trailing={<Toggle value onValueChange={noop} accessibilityLabel="القراءة الليلية" />}
        />
        <NightReadingPicker value="classical" labels={LABELS} isArabic onChange={noop} />
      </SettingsGroup>
    </View>
  );
}

export function SepiaSelected() {
  return (
    <View style={{ width: 380, backgroundColor: '#FBF6EA', borderRadius: 12, borderWidth: 1, borderColor: '#0E27241A' }}>
      <NightReadingPicker value="sepia" labels={LABELS} isArabic onChange={noop} />
    </View>
  );
}

export function IndigoSelected() {
  return (
    <View style={{ width: 380, backgroundColor: '#FBF6EA', borderRadius: 12, borderWidth: 1, borderColor: '#0E27241A' }}>
      <NightReadingPicker value="indigo" labels={LABELS} isArabic onChange={noop} />
    </View>
  );
}
