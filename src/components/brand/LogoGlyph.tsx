import React from 'react';
import Svg, { Defs, ClipPath, G, Rect, Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  /** Override teal background — defaults to `--teal-500` (#0B5D53). */
  bg?: string;
  /** Override gold ornament tone. */
  gold?: string;
  goldSoft?: string;
}

/**
 * The Alfurqan rosette glyph — Kufic-geometric square-in-square inside a
 * teal medallion, with a stylised mushaf at the centre. Use as the primary
 * brand mark in nav chrome, splash, settings.
 */
export function LogoGlyph({
  size = 40,
  bg = '#0B5D53',
  gold = '#B8923F',
  goldSoft = '#E2C480',
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Defs>
        <ClipPath id="lg-clip">
          <Rect x={0} y={0} width={120} height={120} rx={24} />
        </ClipPath>
      </Defs>
      <G clipPath="url(#lg-clip)">
        <Rect width={120} height={120} fill={bg} />
        <Rect x={8} y={8} width={104} height={104} rx={18} fill="none" stroke={gold} strokeWidth={1} opacity={0.6} />
        <G transform="translate(60 60)" stroke={gold} strokeWidth={1.25} fill="none">
          <Rect x={-30} y={-30} width={60} height={60} rx={4} opacity={0.9} />
          <Rect x={-30} y={-30} width={60} height={60} rx={4} transform="rotate(45)" opacity={0.9} />
          <Circle r={30} opacity={0.35} />
          <Circle r={22} opacity={0.55} />
        </G>
        <G transform="translate(60 60)" fill={goldSoft}>
          <Path
            d="M -16 8 Q -16 -2 -6 -2 L 6 -2 Q 16 -2 16 8 L 16 14 Q 16 20 8 20 L -8 20 Q -16 20 -16 14 Z"
            stroke={goldSoft}
            strokeWidth={0.5}
          />
          <Rect x={-2} y={-24} width={4} height={28} rx={1.5} />
          <Circle cx={0} cy={-28} r={2.5} />
        </G>
        <G fill={goldSoft} opacity={0.75}>
          <Circle cx={16} cy={16} r={1.5} />
          <Circle cx={104} cy={16} r={1.5} />
          <Circle cx={16} cy={104} r={1.5} />
          <Circle cx={104} cy={104} r={1.5} />
        </G>
      </G>
    </Svg>
  );
}
