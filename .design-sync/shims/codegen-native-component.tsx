import React from 'react';
import { View } from 'react-native';

/**
 * Libraries call React Native's codegen at load to build a host component the
 * browser has no equivalent for, so each one becomes a plain layout box.
 */
export default function codegenNativeComponent<P extends object>() {
  return React.forwardRef<unknown, P>((props, ref) => (
    <View ref={ref as never} {...(props as object)} />
  ));
}
