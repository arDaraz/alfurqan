import React from 'react';

/**
 * Previews render one screen at a time, so every route action does nothing and
 * a navigator just renders its children.
 */
const noop = () => {};

export const router = {
  push: noop, replace: noop, back: noop, navigate: noop,
  dismiss: noop, dismissAll: noop, setParams: noop,
  canGoBack: () => false,
};

export function useRouter() { return router; }
export function usePathname() { return '/'; }
export function useSegments(): string[] { return []; }
export function useLocalSearchParams<T extends object = Record<string, string>>() { return {} as T; }
export function useFocusEffect() {}

export function Link({ children }: { children?: React.ReactNode; href?: string }) {
  return <>{children}</>;
}

function passthrough({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}
export const Stack = Object.assign(passthrough, { Screen: () => null });
export const Tabs = Object.assign(passthrough, { Screen: () => null });
export const Slot = passthrough;
