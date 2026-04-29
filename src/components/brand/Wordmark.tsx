import React from 'react';
import Svg, {
  Defs,
  ClipPath,
  G,
  Rect,
  Circle,
  Path,
  Line,
  Text as SvgText,
} from 'react-native-svg';

interface Props {
  width?: number;
  height?: number;
  /** Override ink colour for the Arabic name. */
  inkColor?: string;
  /** Override muted colour for the Latin transliteration. */
  mutedColor?: string;
  bg?: string;
  gold?: string;
  goldSoft?: string;
}

/**
 * Full wordmark — glyph + الفرقان (KFGQPC Uthmani) + ALFURQAN (Manrope letterspaced).
 * Use on splash, marketing, About page. For nav chrome use {@link LogoGlyph} alone.
 */
export function Wordmark({
  width = 240,
  height = 64,
  inkColor = '#0E2724',
  mutedColor = '#4A635F',
  bg = '#0B5D53',
  gold = '#B8923F',
  goldSoft = '#E2C480',
}: Props) {
  return (
    <Svg width={width} height={height} viewBox="0 0 360 96">
      <Defs>
        <ClipPath id="wm-clip">
          <Rect x={0} y={0} width={80} height={80} rx={16} />
        </ClipPath>
      </Defs>

      <G transform="translate(8 8)" clipPath="url(#wm-clip)">
        <Rect width={80} height={80} fill={bg} />
        <Rect x={6} y={6} width={68} height={68} rx={12} fill="none" stroke={gold} strokeWidth={1} opacity={0.55} />
        <G transform="translate(40 40)" stroke={gold} strokeWidth={0.9} fill="none">
          <Rect x={-20} y={-20} width={40} height={40} rx={3} />
          <Rect x={-20} y={-20} width={40} height={40} rx={3} transform="rotate(45)" />
          <Circle r={14} opacity={0.5} />
        </G>
        <G transform="translate(40 40)" fill={goldSoft}>
          <Path d="M -11 5 Q -11 -2 -4 -2 L 4 -2 Q 11 -2 11 5 L 11 9 Q 11 13 6 13 L -6 13 Q -11 13 -11 9 Z" />
          <Rect x={-1.3} y={-16} width={2.6} height={19} rx={1} />
          <Circle cx={0} cy={-19} r={1.7} />
        </G>
      </G>

      <SvgText
        x={352}
        y={44}
        fontFamily="KFGQPC-Uthmani"
        fontSize={42}
        fontWeight={600}
        fill={inkColor}
        textAnchor="end"
      >
        الفرقان
      </SvgText>
      <SvgText
        x={352}
        y={76}
        fontFamily="Manrope"
        fontSize={13}
        fontWeight={600}
        letterSpacing={4}
        fill={mutedColor}
        textAnchor="end"
      >
        A L F U R Q A N
      </SvgText>

      <Line x1={102} y1={20} x2={102} y2={76} stroke={gold} strokeWidth={1} opacity={0.4} />
    </Svg>
  );
}
