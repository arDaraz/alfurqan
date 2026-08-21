## Read this before composing anything

These are **React Native** components, served to the browser through
`react-native-web`. That changes three things about how you use them:

1. **They take props, never `className` and never a CSS class.** There is no class
   vocabulary in this system. A component's whole API is its `<Name>.d.ts`.
2. **`style` props take React Native style objects**, not CSS: numbers instead of
   `px`, `flexDirection` defaults to `column`, and there are no shorthands like
   `margin: '0 auto'`. Prefer passing the props a component already exposes.
3. **All visible text lives inside a component.** Do not drop a bare string next
   to one of these.

## No provider, but do set the locale

Nothing needs wrapping. Theme and language come from a store that already has
working defaults: **light theme, Arabic, right to left**. Every component reads
it directly.

To change either, call the store before you render:

```js
const { useSettingsStore } = window.Alfurqan;
useSettingsStore.setState({ language: 'en', themeMode: 'dark' }); // 'light' | 'dark' | 'system'
```

`useRecitationStore`, `useReciterStore` and `useReadingStore` are exported the
same way. Some components take no props and read a store instead - `MiniPlayerBar`
renders nothing at all until `useRecitationStore` holds a session - so seed the
store when a component looks empty.

Arabic is the default, so **lay out right to left** unless you have set
`language: 'en'`.

## Styling your own layout

Style the DS components through their props. For the glue around them - page
background, grids, spacing - use ordinary HTML and CSS with the custom properties
from `styles.css`:

| Family | Count | Names |
| --- | --- | --- |
| `--color-*` | 27 | `bg`, `bgRaised`, `bgSunken`, `bgInverse`, `fg`, `fgMuted`, `fgSubtle`, `fgOnPrimary`, `fgOnGold`, `primary`, `primaryPressed`, `primaryFocus`, `primaryTint`, `primaryFocusRing`, `accent`, `accentSoft`, `success`, `successSoft`, `danger`, `dangerSoft`, `border`, `borderStrong`, `borderGold`, `selectedRange`, `widgetSurface`, `railSurface`, `qiblahNorth` |
| `--space-*` | 9 | `2xs` `xs` `sm` `md` `lg` `xl` `2xl` `3xl` `4xl` (2px → 96px) |
| `--radius-*` | 7 | `xs` `sm` `md` `lg` `xl` `2xl` `pill` |
| `--gutter-*` | 3 | `screen` (24) `row` (16) `ayah` (28) |
| `--text-*-size` / `--text-*-line-height` | 10 steps | `caption` `label` `body` `title` `heading` `display` `hero` `quran` `quranSm` `arabicDisplay` |
| `--font-*` | 9 | `latin` (Manrope), `latinDisplay` (Fraunces), `arabicSerif` (Amiri), `quran` / `arabic` (KFGQPC-Uthmani), `quranSerif` (AmiriQuran) |

The palette is paper and ink with a teal primary and a gold accent. Surfaces are
warm cream, never white: `--color-bg` for a page, `--color-bgRaised` for a card.

**One font trap.** `KFGQPC-Uthmani` draws Arabic-Indic digits as decorated verse
ornaments, not digits - `١٢` comes out as a circled glyph. Set Arabic numerals in
`--font-arabicSerif` (Amiri), and keep technical values like versions, bitrates
and page counts in Latin digits.

## Where the truth is

- `styles.css` - the one stylesheet to link. It imports the tokens and the fonts.
- `components/<group>/<Name>/<Name>.prompt.md` - what a component is for.
- `components/<group>/<Name>/<Name>.d.ts` - its exact props. Read this before use.

Groups: `brand`, `general`, `home`, `widgets`, `settings`, `quran`, `search`,
`bookmarks`, `navigation`, `onboarding`, `splash`, `practice`.

## A composition that works

```jsx
const { SettingsGroup, SettingsRow, Toggle, Pill } = window.Alfurqan;

<div dir="rtl" style={{ background: 'var(--color-bg)', padding: 'var(--gutter-screen)' }}>
  <div style={{ maxWidth: 380, margin: '0 auto' }}>
    <SettingsGroup label="القراءة">
      <SettingsRow
        icon={icon}
        label="خط المصحف"
        value="مصحف المدينة النبوية"
        onPress={openPicker}
        trailing={<Pill label="تغيير" />}
      />
      <SettingsRow
        isLast
        icon={moonIcon}
        label="القراءة الليلية"
        value="دافئ"
        trailing={<Toggle value={night} onValueChange={setNight} />}
      />
    </SettingsGroup>
  </div>
</div>
```

The library component owns its own look; the surrounding `div` uses tokens. That
split is the whole convention.
