import React from 'react';
import { View } from 'react-native';

/**
 * A preview card has no notch, so every inset is zero. The real library reads
 * them from a native host and throws in a browser.
 */
const ZERO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export const SafeAreaInsetsContext = React.createContext(ZERO_INSETS);
export const SafeAreaFrameContext = React.createContext({ x: 0, y: 0, width: 390, height: 844 });

export function useSafeAreaInsets() {
  return ZERO_INSETS;
}

export function useSafeAreaFrame() {
  return React.useContext(SafeAreaFrameContext);
}

export function SafeAreaProvider({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

export const SafeAreaView = View;
export const initialWindowMetrics = { insets: ZERO_INSETS, frame: { x: 0, y: 0, width: 390, height: 844 } };
export type EdgeInsets = typeof ZERO_INSETS;
