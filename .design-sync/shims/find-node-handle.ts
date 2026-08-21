// react-native-web's findNodeHandle throws, and every caller here wants the
// DOM node behind the ref.
export default function findNodeHandle(ref: unknown): unknown {
  const current = (ref as { current?: unknown } | null)?.current;
  return current ?? ref ?? null;
}
