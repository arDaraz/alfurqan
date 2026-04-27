import React from 'react';
import Svg, { G, Circle, Rect } from 'react-native-svg';

export type AyahRosetteVariant = 'ayah' | 'inline' | 'compact';

const VARIANT_CONFIG = {
  ayah:    { size: 32, strokeWidth: 1 },
  inline:  { size: 24, strokeWidth: 1 },
  compact: { size: 18, strokeWidth: 1.2 },
} as const;

interface Props {
  variant?: AyahRosetteVariant;
  /** Override size (ignores variant size). */
  size?: number;
  color?: string;
}

export function AyahRosette({ variant = 'inline', size, color = '#B8923F' }: Props) {
  const cfg = VARIANT_CONFIG[variant];
  const resolvedSize = size ?? cfg.size;
  const showInnerCircle = variant !== 'compact';

  return (
    <Svg width={resolvedSize} height={resolvedSize} viewBox="0 0 32 32">
      <G transform="translate(16 16)" fill="none" stroke={color} strokeWidth={cfg.strokeWidth}>
        <Circle r={13} opacity={0.9} />
        {showInnerCircle && <Circle r={9} opacity={0.55} />}
        <Rect x={-7} y={-7} width={14} height={14} />
        <Rect x={-7} y={-7} width={14} height={14} transform="rotate(45)" />
        <Circle r={3} fill={color} stroke="none" />
      </G>
    </Svg>
  );
}
