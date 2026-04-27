import React from 'react';
import Svg, { G, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** When set, the star body is filled with this color (gold-stroke variant from the design system). */
  fill?: string;
}

/**
 * Eight-point khātam star — the surah-numeral framing used on the Home list.
 * Square + rotated-square forms an eight-point figure; matches the rosette
 * inside the brand glyph.
 *
 * Pass `fill` to render the design-system "rosette" variant (dark filled body
 * with a thin gold stroke). Omit it for the original outline variant.
 */
export function KhatamStar({
  size = 44,
  color = '#B8923F',
  strokeWidth = 1.4,
  fill,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 44 44" pointerEvents="none">
      <G transform="translate(22 22)" stroke={color} strokeWidth={strokeWidth} fill={fill ?? 'none'}>
        <Rect x={-15} y={-15} width={30} height={30} />
        <Rect x={-15} y={-15} width={30} height={30} transform="rotate(45)" />
      </G>
    </Svg>
  );
}
