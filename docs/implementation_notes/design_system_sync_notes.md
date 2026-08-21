# Design system sync

Exports the component library to a browser bundle so it can be designed with
outside the app.

The working reference lives in `.design-sync/NOTES.md`: how to run a sync, what
every shim is for, and what a future sync should watch. This file records the
decisions and the verification behind that setup.

## Decisions

**Shims declared as tsconfig paths, not a forked converter.** The build resolves
`compilerOptions.paths` from `.design-sync/tsconfig.ds-sync.json`, so every alias
is one config entry and no build script is copied into the repo. A fork would
have had to be re-merged against every upstream change.

**Generated inputs, not committed ones.** `.design-sync/gen.ts` derives the bundle
entry, the tokens CSS and the prop types from `componentSrcMap`. Adding a
component is a config edit. The three outputs are gitignored because any of them
drifting from the config would be silent.

**`dist/types/ds-props.d.ts` instead of touching `src/`.** The components declare
a local `interface Props`, which the extractor cannot find. A generated
`ComponentProps<typeof import('...')>` alias per component resolves back to the
real source types, JSDoc included. No component file changed, and no `types`
field was added to `package.json`.

**Shims answer honestly.** A stubbed query returns empty rather than invented
content, so a data-driven component renders its own empty state. Where that
leaves a blank band on a card, the grade note says so.

**Rejected: hand-written prop contracts for all 52 components.** Accurate on the
day it was written and stale by the next component edit. Eleven components still
carry a `dtsPropsFor` override, each for a specific extractor limit recorded in
`.design-sync/NOTES.md`.

## Repository change this required

Three regex literals held Arabic characters directly. A bundler with an ASCII
charset escapes string literals but never regex bodies, so the character classes
only parsed inside a UTF-8 document and threw
`Range out of order in character class` anywhere else. They now use `\uXXXX`
escapes, which is the same pattern with no encoding dependency. In
`quranTextNormalizer.ts` this also matches the six neighbouring constants, which
were already written that way.

## Verification

- `package-validate.mjs` exits 0: 52/52 previews render in headless Chromium,
  no warnings.
- 52 authored previews, 149 cells, every cell reviewed against a screenshot and
  graded.
- `src/data` and `src/services/verification` suites pass, 26 tests.
- `eslint` clean on both changed files.
- Every class, token, font family and component named in
  `.design-sync/conventions.md` was checked against the built artifacts.

## Known app issues found while doing this, not fixed here

- `ReaderHeader` draws page and juz numbers in the Quran font, which renders
  Arabic-Indic digits as circled ayah-marker glyphs. `InfoSheet` already solves
  this with its `numeric` row flag.
- `MushafScreenLayout` shows an English repository error to an Arabic reader.
