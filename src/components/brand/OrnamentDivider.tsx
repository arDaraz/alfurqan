import React from 'react';
import Svg, { G, Line, Circle, Path, Rect, Defs, RadialGradient, Stop } from 'react-native-svg';

export type OrnamentTier = 'full' | 'medium' | 'compact';

const TIER_CONFIG = {
  full:    { width: 560, opacity: 1 },
  medium:  { width: 280, opacity: 0.55 },
  compact: { width: 200, opacity: 0.4 },
} as const;

interface Props {
  tier?: OrnamentTier;
  /** Override width (ignores tier width). */
  width?: number;
  color?: string;
  /** Shift gold warmer for dark/ink backgrounds (design spec: brightness 1.35, saturation 0.8). */
  darkMode?: boolean;
}

const DARK_GOLD = '#D4AB5E';
const DARK_GRADIENT_START = '#F0D590';
const DARK_GRADIENT_MID = '#D4AB5E';
const DARK_GRADIENT_END = '#A88438';

export function OrnamentDivider({
  tier = 'medium',
  width,
  color,
  darkMode = false,
}: Props) {
  const cfg = TIER_CONFIG[tier];
  const resolvedWidth = width ?? cfg.width;
  const resolvedHeight = Math.round((resolvedWidth * 100) / 600);
  const resolvedColor = color ?? (darkMode ? DARK_GOLD : '#B8923F');
  const tierOpacity = width != null ? 1 : cfg.opacity;

  const gradStart = darkMode ? DARK_GRADIENT_START : '#E2C480';
  const gradMid = darkMode ? DARK_GRADIENT_MID : '#B8923F';
  const gradEnd = darkMode ? DARK_GRADIENT_END : '#8C6E2A';

  const showHairlines = resolvedWidth >= 200;

  return (
    <Svg width={resolvedWidth} height={resolvedHeight} viewBox="0 0 600 100">
      <Defs>
        <RadialGradient id="rgold" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0" stopColor={gradStart} />
          <Stop offset="0.7" stopColor={gradMid} />
          <Stop offset="1" stopColor={gradEnd} />
        </RadialGradient>
      </Defs>

      <G stroke={resolvedColor} fill="none" strokeLinecap="round" opacity={tierOpacity}>
        {showHairlines && (
          <>
            <Line x1={20} y1={50} x2={220} y2={50} strokeWidth={0.7} opacity={0.55} />
            <Line x1={380} y1={50} x2={580} y2={50} strokeWidth={0.7} opacity={0.55} />

            <Line x1={60} y1={50} x2={208} y2={50} strokeWidth={0.5} opacity={0.35} />
            <Line x1={392} y1={50} x2={540} y2={50} strokeWidth={0.5} opacity={0.35} />

            <G fill={resolvedColor} stroke="none">
              <Circle cx={20} cy={50} r={1.4} opacity={0.55} />
              <Circle cx={580} cy={50} r={1.4} opacity={0.55} />
            </G>
          </>
        )}

        <G transform="translate(232 50)">
          <Path d="M0 -10 L10 0 L0 10 L-10 0 Z" strokeWidth={0.9} />
          <Path d="M0 -6 L6 0 L0 6 L-6 0 Z" strokeWidth={0.7} opacity={0.7} />
          <Circle r={1.6} fill={resolvedColor} stroke="none" />
        </G>

        <G fill={resolvedColor} stroke="none">
          <Circle cx={252} cy={50} r={1.2} opacity={0.45} />
          <Circle cx={262} cy={50} r={1.6} opacity={0.7} />
          <Circle cx={272} cy={50} r={1.2} opacity={0.45} />
        </G>

        <G transform="translate(300 50)">
          <Circle r={30} strokeWidth={0.5} opacity={0.25} />

          <G strokeWidth={0.7} opacity={0.75}>
            <Path d="M0 -22 Q -6 -16 0 -10 Q 6 -16 0 -22" />
            <Path d="M0  22 Q -6  16 0  10 Q 6  16 0  22" />
            <Path d="M-22 0 Q -16 -6 -10 0 Q -16  6 -22 0" />
            <Path d="M 22 0 Q  16 -6  10 0 Q  16  6  22 0" />
          </G>

          <Rect x={-13} y={-13} width={26} height={26} strokeWidth={0.9} />
          <Rect x={-13} y={-13} width={26} height={26} transform="rotate(45)" strokeWidth={0.9} />

          <Circle r={9} strokeWidth={0.7} opacity={0.75} />
          <Rect x={-4.5} y={-4.5} width={9} height={9} transform="rotate(22.5)" strokeWidth={0.5} opacity={0.55} />

          <Circle r={2.4} fill="url(#rgold)" stroke="none" />

          <G strokeWidth={0.4} opacity={0.5}>
            <Path d="M-30 -12 Q 0 -28 30 -12" />
            <Path d="M-30 12 Q 0 28 30 12" />
          </G>

          <G strokeWidth={0.3} opacity={0.4}>
            <Line x1={0} y1={-30} x2={0} y2={-22} />
            <Line x1={0} y1={22} x2={0} y2={30} />
            <Line x1={-30} y1={0} x2={-22} y2={0} />
            <Line x1={22} y1={0} x2={30} y2={0} />
          </G>
        </G>

        <G fill={resolvedColor} stroke="none">
          <Circle cx={328} cy={50} r={1.2} opacity={0.45} />
          <Circle cx={338} cy={50} r={1.6} opacity={0.7} />
          <Circle cx={348} cy={50} r={1.2} opacity={0.45} />
        </G>

        <G transform="translate(368 50)">
          <Path d="M0 -10 L10 0 L0 10 L-10 0 Z" strokeWidth={0.9} />
          <Path d="M0 -6 L6 0 L0 6 L-6 0 Z" strokeWidth={0.7} opacity={0.7} />
          <Circle r={1.6} fill={resolvedColor} stroke="none" />
        </G>
      </G>
    </Svg>
  );
}
