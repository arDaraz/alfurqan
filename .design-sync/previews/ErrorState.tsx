import React from 'react';
import { View } from 'react-native';
import { ErrorState } from 'alfurqan';

const noop = () => {};

const FRAME = { width: 380, height: 300 } as const;

export function PageLoadFailed() {
  return (
    <View style={FRAME}>
      <ErrorState message="تعذّر تحميل هذه الصفحة. يرجى المحاولة مرة أخرى." onRetry={noop} />
    </View>
  );
}

export function NoConnection() {
  return (
    <View style={FRAME}>
      <ErrorState message="لا يوجد اتصال بالإنترنت - جرّب لاحقًا أو نزّل السورة" onRetry={noop} />
    </View>
  );
}

export function ContentPackMissing() {
  return (
    <View style={FRAME}>
      <ErrorState
        message="حزمة هذا المصحف مفقودة أو تالفة. أعد تثبيت التطبيق لاستعادتها."
        onRetry={noop}
      />
    </View>
  );
}
