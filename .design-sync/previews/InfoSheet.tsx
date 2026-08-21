import React from 'react';
import { View } from 'react-native';
import { InfoSheet } from 'alfurqan';

const noop = () => {};

// The Modal portals to the page root, so the sheet paints over the whole
// capture viewport. This backdrop fills the same area with app paper, which
// keeps the scrim reading as an overlay on a screen instead of on white.
const BACKDROP = { width: 852, height: 652, backgroundColor: '#F5EEDB' } as const;

export function ReaderPageInfo() {
  return (
    <View style={BACKDROP}>
      <InfoSheet
        visible
        title="معلومات الصفحة"
        rows={[
          { label: 'السورة', value: 'البقرة' },
          { label: 'الجزء', value: '٢', numeric: true },
          { label: 'الصفحة', value: '٤٩ من ٦٠٤', numeric: true },
          { label: 'المصحف', value: 'مصحف المدينة النبوية' },
        ]}
        note="الاعتمادات: مجمع الملك فهد لطباعة المصحف الشريف"
        onClose={noop}
      />
    </View>
  );
}

export function AboutApp() {
  return (
    <View style={BACKDROP}>
      <InfoSheet
        visible
        title="عن التطبيق"
        rows={[
          { label: 'الفرقان · تسميع', value: '١٫٠٫٠', numeric: true },
          { label: 'المصحف', value: 'مصحف المدينة النبوية' },
          { label: 'القارئ', value: 'مشاري راشد العفاسي' },
        ]}
        note="الاعتمادات: بيانات القرآن من مشروع Tanzil، وخط حفص من مجمع الملك فهد."
        onClose={noop}
      />
    </View>
  );
}
