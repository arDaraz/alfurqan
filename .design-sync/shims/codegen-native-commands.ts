// Native view commands have no browser equivalent, so each one is ignored.
export default function codegenNativeCommands() {
  return new Proxy({}, { get: () => () => undefined });
}
