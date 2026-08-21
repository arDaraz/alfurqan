import createCSSStyleSheet from 'react-native-web/dist/exports/StyleSheet/dom/createCSSStyleSheet';

/**
 * A tool that finds preview mount roots by an `r` id prefix matches
 * react-native-web's own `react-native-stylesheet` element first and reads the
 * card as empty. The prefix keeps the id findable and out of that way.
 */
export default function createPrefixedCSSStyleSheet(
  id: string,
  rootNode?: Node,
  textContent?: string,
) {
  return createCSSStyleSheet(`ds-${id}`, rootNode, textContent);
}
