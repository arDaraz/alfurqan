import React from 'react';
import Svg, { G, Path, Rect, Circle } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
  /** Gold stroke color used for the frame and ornaments. */
  color?: string;
  /** Cream/paper fill used inside the diamonds and ornaments to cover the underlying page bg. */
  fillColor?: string;
}

const VIEW_W = 440;
const VIEW_H = 80;

// Outer hexagon: top edge → right chevron tip → bottom edge → left chevron tip.
const OUTER_PATH = `M 22,6 L 418,6 L 440,40 L 418,74 L 22,74 L 0,40 Z`;
// Inner hexagon: parallel offset of ~6 on horizontal edges, ~8 inset at the chevron tips so the converging lines stay parallel-looking.
const INNER_PATH = `M 28,12 L 412,12 L 432,40 L 412,68 L 28,68 L 8,40 Z`;

/**
 * Sarlawh — the surah title cartouche. A stretched hexagonal frame with
 * gold double-line border, small diamonds tucked inside the left/right
 * chevron tips, and small diamond ornaments centered on the top/bottom
 * edges. The surah name renders centered inside the panel (handled by
 * the consumer).
 */
export function SurahCartouche({
  width = 320,
  height = (320 * VIEW_H) / VIEW_W,
  color = '#B8923F',
  fillColor = '#F5EEDB',
}: Props) {
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
      <G fill="none" stroke={color}>
        <Path d={OUTER_PATH} strokeWidth={1.3} strokeLinejoin="miter" />
        <Path d={INNER_PATH} strokeWidth={0.6} opacity={0.55} strokeLinejoin="miter" />
      </G>

      <G transform="translate(12 40)">
        <Rect x={-8} y={-8} width={16} height={16} fill={fillColor} stroke={color} strokeWidth={1.1} transform="rotate(45)" />
        <Circle r={1.8} fill={color} />
      </G>

      <G transform="translate(428 40)">
        <Rect x={-8} y={-8} width={16} height={16} fill={fillColor} stroke={color} strokeWidth={1.1} transform="rotate(45)" />
        <Circle r={1.8} fill={color} />
      </G>

      <G transform={`translate(${VIEW_W / 2} 6)`}>
        <Rect x={-4} y={-4} width={8} height={8} fill={fillColor} stroke={color} strokeWidth={0.9} transform="rotate(45)" />
      </G>

      <G transform={`translate(${VIEW_W / 2} ${VIEW_H - 6})`}>
        <Rect x={-4} y={-4} width={8} height={8} fill={fillColor} stroke={color} strokeWidth={0.9} transform="rotate(45)" />
      </G>
    </Svg>
  );
}
