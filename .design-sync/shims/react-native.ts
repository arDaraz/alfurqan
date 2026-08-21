// react-native-web plus the native-only names libraries import but never call.
export * from 'react-native-web/dist/index.js';

const nativeModule = new Proxy(
  {},
  { get: () => () => undefined },
);

export const TurboModuleRegistry = {
  get: () => null,
  getEnforcing: () => nativeModule,
};

export const requireNativeComponent = () => 'RCTView';
export const codegenNativeComponent = () => 'RCTView';
export const codegenNativeCommands = () => nativeModule;
export const DevSettings = { addMenuItem: () => {}, reload: () => {} };

// Android-only view gesture-handler imports unconditionally.
export const DrawerLayoutAndroid = () => null;
export const TouchableNativeFeedbackAndroid = () => null;
