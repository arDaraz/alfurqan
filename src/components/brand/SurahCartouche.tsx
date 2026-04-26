import React from 'react';
import Svg, { G, Path, Circle, Line } from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
  color?: string;
}

/**
 * Sarlawh cartouche — the ornamental frame used exclusively around surah
 * titles on the Mushaf opening page. Never repurpose for generic headings.
 */
export function SurahCartouche({
  width = 200,
  height = 160,
  color = '#B8923F',
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 160">
      <G fill="none" stroke={color}>
        <Path
          d="M 20 80 Q 20 20 60 20 L 140 20 Q 180 20 180 80 L 180 140 L 20 140 Z"
          strokeWidth={1.25}
          opacity={0.85}
        />
        <Path
          d="M 28 84 Q 28 28 64 28 L 136 28 Q 172 28 172 84 L 172 132 L 28 132 Z"
          strokeWidth={0.75}
          opacity={0.55}
        />
        <G opacity={0.7} strokeWidth={0.9}>
          <Path d="M 60 20 Q 70 12 80 20" />
          <Path d="M 80 20 Q 90 12 100 20" />
          <Path d="M 100 20 Q 110 12 120 20" />
          <Path d="M 120 20 Q 130 12 140 20" />
        </G>
        <Circle cx={12} cy={80} r={4} opacity={0.8} />
        <Circle cx={188} cy={80} r={4} opacity={0.8} />
        <Line x1={60} y1={140} x2={140} y2={140} strokeWidth={0.75} opacity={0.6} />
      </G>
    </Svg>
  );
}
