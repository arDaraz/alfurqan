import React from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/** Runs of Arabic-Indic digits, keeping a clock separator inside one run. */
const DIGIT_RUN = /([٠-٩]+(?::[٠-٩]+)*)/g;
/** Non-global twin, so `test` never carries `lastIndex` between calls. */
const IS_DIGIT_RUN = /^[٠-٩]/;

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  /** Applied to digit runs only. Omit to leave the text untouched. */
  numeralStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  accessibilityLabel?: string;
}

/**
 * Renders a sentence whose digits must not take the Quran font — KFGQPC-Uthmani
 * wraps them in ayah-marker ornaments, which is right for an ayah number and
 * wrong for a count, a page or a clock time.
 */
export function NumeralText({ children, style, numeralStyle, ...rest }: Props) {
  if (!numeralStyle) {
    return (
      <Text style={style} {...rest}>
        {children}
      </Text>
    );
  }

  const parts = children.split(DIGIT_RUN);
  return (
    <Text style={style} {...rest}>
      {parts.map((part, i) =>
        IS_DIGIT_RUN.test(part) ? (
          <Text key={i} style={numeralStyle}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}
