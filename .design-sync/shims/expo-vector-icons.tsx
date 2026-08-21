import React from 'react';
import { Text } from 'react-native';
import glyphs from '@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * The real package loads a native module, so this draws the same glyph from
 * the same Material Community font instead.
 */
export function MaterialCommunityIcons({ name, size = 24, color, style }: IconProps) {
  const point = (glyphs as Record<string, number>)[name];
  return (
    <Text
      style={[
        { fontFamily: 'MaterialCommunityIcons', fontSize: size, color, lineHeight: size * 1.05 },
        style,
      ]}
    >
      {point ? String.fromCodePoint(point) : ''}
    </Text>
  );
}

export default { MaterialCommunityIcons };
