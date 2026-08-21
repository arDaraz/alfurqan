// Libraries read React Native and Expo globals as they load, so the generated
// entry imports this first.
const g = globalThis as {
  process?: { env: Record<string, string | undefined> };
  global?: unknown;
  __DEV__?: boolean;
  ErrorUtils?: unknown;
  expo?: { NativeModule: unknown; modules: Record<string, unknown> };
};

g.process ??= { env: {} };
g.process.env.EXPO_OS ??= 'web';
g.process.env.NODE_ENV ??= 'development';
g.global ??= globalThis;
g.__DEV__ ??= false;
g.ErrorUtils ??= {
  setGlobalHandler: () => undefined,
  getGlobalHandler: () => () => undefined,
  reportError: (error: unknown) => console.error(error),
  reportFatalError: (error: unknown) => console.error(error),
};

// An Expo native module stubs to `undefined`, the signal expo-modules-core
// checks before raising its own error. Emitters wire up listeners on
// construction, so those stay callable.
const LISTENER_METHODS = new Set([
  'addListener',
  'removeListener',
  'removeListeners',
  'removeAllListeners',
  'startObserving',
  'stopObserving',
]);

const nativeModuleStub = new Proxy(
  {},
  { get: (_target, key) => (LISTENER_METHODS.has(key as string) ? () => undefined : undefined) },
);

g.expo ??= {
  NativeModule: class {},
  modules: new Proxy({}, { get: () => nativeModuleStub }),
};
