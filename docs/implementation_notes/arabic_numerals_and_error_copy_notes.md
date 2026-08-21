# Arabic numerals and error copy

Two unrelated defects, both of which showed an Arabic reader something wrong.

## Digits drawn as ayah ornaments

`KFGQPC-Uthmani` maps U+0660-U+0669 to its rosette-interior glyphs, so an
Arabic-Indic digit set in it comes out as a decorated verse marker rather than a
number. Page 293 in the reader header read as a row of circles. The font also has
no glyph for U+066B, the Arabic decimal separator.

`theme.fonts.arabic`, `arabicMedium`, `arabicSemiBold`, `arabicBold` and `quran`
all resolve to that one family, so any of them draws digits the same way.

**The rule that follows:** Arabic body text takes the Quran family; a digit run
takes `theme.fonts.arabicSerif` (Amiri), which covers Arabic-Indic digits, the
decimal separator, ASCII digits and Arabic letters. `NumeralText` already existed
for the mixed-sentence case and is used wherever a string interleaves words and
numbers.

**Not `theme.fonts.latin`.** Manrope has no Arabic-Indic digits and no Arabic
letters at all, so the places that reached for it were not fixed, only moved to
an unbundled system fallback. `InfoSheet`'s `numeric` flag did this, and because
it applies to the whole row, the Arabic word `من` in `٢٩٣ من ٦٠٤` fell back too.
That flag now selects Amiri for Arabic.

Sites corrected: the reader header, the settings row value (which covers the
khatam plan and the mushaf layout name), the mushaf layout picker's card title
and meta line, the bookmark snackbar and category sheet subtitles, the bookmark
tab counts, the InfoSheet numeric rows, and the web reader's page indicator.
`strings.mushafPageIndicator` also mixed numeral systems in one Arabic sentence.

## English errors shown to Arabic readers

`MushafScreenLayout` preferred `err.message` over its localized prop, so the
usual path put a developer string such as `The Madani content pack failed
integrity checks` in front of the reader. The prop itself was no better: both
callers hard-coded English, because neither route had `useStrings()` in scope.

The fix follows the pattern `useMushafPage` and `MushafPage` already use: a catch
stores an error *code*, and the render maps the code to a localized string. The
`errorMessage` prop is gone, since a prop that takes pre-rendered copy is what
invited the bug.

`useSurahList` and `useJuzList` had the same defect on the Search tab, reached
through `SurahBrowser`. They now carry a boolean, and `ErrorState` supplies its
own localized default.

## Left alone deliberately

- `useMushafPage` branches on the English word `font` appearing inside a thrown
  message, so those repository strings are load-bearing for control flow.
  Localizing them in place would silently break the font-error branch.
- `JuzListItem`'s juz-start ayah number inherits the Quran font from its parent
  `Text`, but its `fontSize` is raised to 22 with `textAlignVertical: 'center'`,
  which reads as a deliberately sized ornament. It needs a design call.
- Wider localization debt found while sweeping: `AyahPopup`, `PlayerSheet` and
  `ReciterPickerSheet` hard-code Arabic labels, `recitationEngine` hard-codes
  Arabic error copy in a service layer, and `BookmarkRow` uses test IDs as
  accessibility labels. All separate from these two defects.

## Verification

- `tsc --noEmit` clean, `expo lint` at the same 134 warnings as the base commit,
  305 tests pass.
- Each corrected surface was rendered in a browser through the design-system
  bundle and read back from the screenshot, since a font defect is invisible to
  a type check and to the test suite.
