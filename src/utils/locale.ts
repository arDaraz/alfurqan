import { Platform, NativeModules } from 'react-native';

export type AppLanguage = 'ar' | 'en';

export function getDeviceLanguage(): AppLanguage {
  let locale = 'en';
  if (Platform.OS === 'ios') {
    locale = NativeModules.SettingsManager?.settings?.AppleLocale
      || NativeModules.SettingsManager?.settings?.AppleLanguages?.[0]
      || 'en';
  } else {
    locale = NativeModules.I18nManager?.localeIdentifier || 'en';
  }
  return locale.startsWith('ar') ? 'ar' : 'en';
}
