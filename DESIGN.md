---
name: Mushaf Al Furqan
description: A reverent, distraction-free Madani mushaf and recitation coach for daily tasmīʿ.
colors:
  madani-paper-cream: "#F5EEDB"
  paper-light: "#FBF6EA"
  paper-deep: "#EBE2C9"
  paper-edge: "#D8CBA6"
  mushaf-ink: "#0E2724"
  mushaf-ink-muted: "#1F3D3A"
  mushaf-ink-soft: "#4A635F"
  mushaf-ink-subtle: "#8A9F9B"
  sajjada-teal: "#0B5D53"
  sajjada-teal-pressed: "#094A42"
  sajjada-teal-focus: "#063831"
  sajjada-teal-deep: "#02201C"
  sajjada-teal-soft: "#6FA396"
  sajjada-teal-tint: "#C8DDD5"
  sajjada-teal-wash: "#E9F1EE"
  sajjada-tint-overlay: "#0B5D531A"
  sarlawh-gold: "#B8923F"
  sarlawh-gold-soft: "#E2C480"
  sarlawh-gold-deep: "#8A6A26"
  tasbih-sage: "#5F8567"
  tasbih-sage-soft: "#DCE7D9"
  tajwid-rose: "#A14444"
  tajwid-rose-soft: "#F3DFD9"
  night-paper: "#EFE5CE"
  night-bg: "#0A1C1A"
  night-bg-raised: "#0F2420"
  night-bg-sunken: "#061412"
typography:
  display:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  heading:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.18em"
  caption:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
  mushaf:
    fontFamily: "KFGQPC-Uthmani, AmiriQuran, serif"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 2.35
    letterSpacing: 0
  arabic-ui:
    fontFamily: "KFGQPC-Uthmani, serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
  editorial:
    fontFamily: "Fraunces, Georgia, serif"
    fontSize: "44px"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.01em"
rounded:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "28px"
  "2xl": "36px"
  pill: "9999px"
spacing:
  "2xs": "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
  "3xl": "64px"
  "4xl": "96px"
  gutter-screen: "24px"
  gutter-row: "16px"
  gutter-ayah: "28px"
components:
  button-primary:
    backgroundColor: "{colors.sajjada-teal}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
    typography: "{typography.label}"
  button-primary-pressed:
    backgroundColor: "{colors.sajjada-teal-pressed}"
    textColor: "{colors.paper-light}"
  button-accent:
    backgroundColor: "{colors.sarlawh-gold}"
    textColor: "{colors.mushaf-ink}"
    rounded: "{rounded.sm}"
    padding: "5px 15px"
    typography: "{typography.label}"
  button-accent-pressed:
    backgroundColor: "{colors.sarlawh-gold-deep}"
    textColor: "{colors.mushaf-ink}"
  pill-tab:
    backgroundColor: "{colors.paper-deep}"
    textColor: "{colors.mushaf-ink-soft}"
    rounded: "{rounded.xl}"
    padding: "10px 14px"
    typography: "{typography.label}"
  pill-tab-active:
    backgroundColor: "{colors.sajjada-teal}"
    textColor: "{colors.paper-light}"
  surah-list-item:
    backgroundColor: "{colors.madani-paper-cream}"
    textColor: "{colors.mushaf-ink}"
    rounded: "{rounded.md}"
    padding: "14px 14px"
    typography: "{typography.body}"
  surah-list-item-active:
    backgroundColor: "{colors.sajjada-tint-overlay}"
    textColor: "{colors.sajjada-teal}"
  greeting-card:
    backgroundColor: "{colors.sajjada-teal}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.lg}"
    padding: "18px 18px"
    typography: "{typography.title}"
  settings-row:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.mushaf-ink}"
    rounded: "{rounded.md}"
    padding: "13px 14px"
    typography: "{typography.body}"
  practice-mic-fab:
    backgroundColor: "{colors.sajjada-teal}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.pill}"
    size: "60px"
  ornament-divider:
    backgroundColor: "{colors.madani-paper-cream}"
    textColor: "{colors.sarlawh-gold}"
    padding: "16px 0"
    typography: "{typography.caption}"
---

# Design System: Mushaf Al Furqan

## 1. Overview

**Creative North Star: "The Study Desk and Prayer Rug"**

Mushaf Al Furqan is a private surface for scripture, not a destination of its own. The visual system is quiet, exact, and bilingual. Cream paper carries the page; ink carries the word; teal and gold appear only where ceremony demands them. The interface dissolves around the mushaf so the user looks at scripture, not at the app.

The system explicitly rejects four neighbors. **Web-SaaS chrome** (Quran.com): no tabbed page headers, no sidebars, no settings panel surrounding the page. **AI-startup gloss** (Tarteel): no neon-on-dark, no streak gamification, no "AI-powered" badge language. **Islamic clipart** (SalamWeb): no crescents, no mosque silhouettes, no primary emerald. **Feature creep with photographic religious imagery** (generic prayer-time apps): no Kaaba photos, no qibla compass, no hijri widgets. Every ornament traces back to real Madani-mushaf geometry — sarlawh frames, ayah-end medallions, and the project's own hand-drawn Kufic rosette glyph.

The atmosphere is monastic. Restrained motion, sober palette, precise type. The app should feel like a study desk and a prayer rug, not a SaaS dashboard or an AI demo.

**Key Characteristics:**
- Cream-paper aesthetic. The light theme is paper, not white. The dark theme is "night reading," not generic SaaS dark.
- Bilingual and RTL-first. Arabic is the primary text; Latin chrome adapts to it.
- Restrained color, with one ceremonial accent. Sarlawh Gold appears on ≤10% of any surface; Sajjada Teal carries identity, never decoration.
- Authentic ornaments only. Ayah rosettes, sarlawh cartouches, Kufic glyph. No clip-art Islamic iconography.
- Flat by default with one ceremonial lift. The Practice FAB is the single floating element on the entire app.

## 2. Colors: The Mushaf Palette

Six named hue families ground the system: paper, ink, teal, gold, sage, rose. Every neutral is tinted toward the warmth of paper. There is no `#fff` and no `#000`.

### Primary
- **Sajjada Teal** (`#0B5D53`): The brand identity color. The active pill on segmented controls, the bottom-tab focus state, the Practice FAB, the GreetingCard background. Named for the prayer rug — a color you stand on, not a color you decorate with.
- **Sajjada Teal Pressed** (`#094A42`): Pressed/hover state for primary buttons.
- **Sajjada Teal Focus** (`#063831`): Focus ring + the deepest stop in the GreetingCard gradient.
- **Sajjada Tint Overlay** (`#0B5D531A`, ~10% alpha): The selection ground for active list rows and the leading-edge active bar marker.

### Secondary
- **Sarlawh Gold** (`#B8923F`): The single ceremonial accent. Used on ayah-end rosettes, ornament dividers, the GreetingCard CTA button, and the FAB halo ring. Named for the gilded title-frame above each surah in a printed Madani mushaf.
- **Sarlawh Gold Soft** (`#E2C480`): The light counterpart, used for caption labels on dark surfaces (the "CONTINUE READING" overline on the GreetingCard) and the radial highlight on the same card.
- **Sarlawh Gold Deep** (`#8A6A26`): Pressed state for accent buttons.

### Tertiary
- **Tasbīh Sage** (`#5F8567`): The "correct word" affirmation in Practice Mode and any success toast. Named for the bead between recitations — a quiet positive, not a celebration.
- **Tajwīd Rose** (`#A14444`): The "miscue" correction in Practice Mode and any danger state. Soft enough to be a sheikh's correction, never an alert.

### Neutral
- **Madani Paper Cream** (`#F5EEDB`): The default surface. The light theme `bg`. The mushaf's own paper.
- **Paper Light** (`#FBF6EA`): Raised surface (cards, settings rows). One step warmer than the page.
- **Paper Deep** (`#EBE2C9`): Sunken surface (the track behind pill tabs, search input fields). One step cooler than the page.
- **Paper Edge** (`#D8CBA6`): The boundary stop. Reserved for hairline dividers under high-density type.
- **Mushaf Ink** (`#0E2724`): The primary text color. A teal-tinted near-black, never `#000`.
- **Mushaf Ink Muted** (`#1F3D3A`): Secondary headings and emphasized labels.
- **Mushaf Ink Soft** (`#4A635F`): Body subtitles, settings values, list metadata.
- **Mushaf Ink Subtle** (`#8A9F9B`): Tertiary captions, inactive tab labels, chevron strokes.

### Night Reading Mode
- **Night Bg** (`#0A1C1A`): Dark theme surface. Not pure black — a teal-tinted near-black so the same warm character carries into night reading.
- **Night Bg Raised** (`#0F2420`) / **Night Bg Sunken** (`#061412`): The same three-step layering as the paper theme.
- **Night Paper** (`#EFE5CE`): The dark-mode `fg`. A warm cream that recalls a page lit by a single lamp.

### Named Rules

**The One Voice Rule.** The primary accent — Sarlawh Gold — appears on ≤10% of any given screen. Its rarity is the point. Use it for ayah-end rosettes, the ornament divider, the GreetingCard CTA, the FAB halo, and absolutely nowhere else by reflex.

**The No Pure Black or White Rule.** Every neutral is tinted toward paper warmth. `#000` and `#fff` are forbidden. The cream theme uses `#F5EEDB` for surfaces and `#0E2724` for ink; the night theme uses `#0A1C1A` for surfaces and `#EFE5CE` for ink. Both keep the same hue family.

**The Sajjada Teal Identity Rule.** Sajjada Teal is identity, not decoration. Use it for the GreetingCard, the active pill, the Practice FAB, the bottom-tab focus, and the surah-list active marker. Do not use it for icon strokes, hairline dividers, or generic body emphasis.

## 3. Typography

**Latin Display & Body Font:** Manrope (variable, weights 400/500/600/700/800)
**Editorial Serif (single use only):** Fraunces (variable, italic available)
**Quranic Script:** KFGQPC-Uthmani (the canonical Madani print mushaf glyph)
**Arabic Body Serif:** AmiriQuran (long-form Arabic where Quranic glyph would over-decorate UI)

**Character.** Manrope is humanist and geometric; it disappears under content. Fraunces is editorial and warm; it appears once, in the splash and onboarding pull-quote. KFGQPC-Uthmani is the printed mushaf glyph; it must never share a Text element with Latin numerals or it will wrap them as ayah-marker ornaments.

### Hierarchy
- **Editorial** (Fraunces 300, 44px / 1.05): The splash subtitle ("Recite. We Listen."). Appears nowhere else by reflex.
- **Display** (Manrope 700, 40px / 1.1, tracking −0.02em): Marketing-tier hero only. Almost never used in product chrome.
- **Heading** (Manrope 700, 28px / 1.25, tracking −0.01em): Settings section labels, screen-level headings.
- **Title** (Manrope 600, 22px / 1.3): Surah/Juz row primary names in Latin context, GreetingCard title.
- **Body** (Manrope 400, 17px / 1.55): Default UI body. Settings values, list metadata, surah meanings. Capped at 65–75ch on long-form surfaces.
- **Label** (Manrope 700, 14px / 1.45, tracking 0.18em, UPPERCASE): Section overlines ("CONTINUE READING"), button text, KhatamStar inner numerals. The 0.18em tracking is the spec.
- **Caption** (Manrope 400, 12px / 1.4): Tab-bar labels, ayatLabel, timestamps.
- **Mushaf** (KFGQPC-Uthmani 400, 30px / 2.35): Quranic scripture only. Never used outside the mushaf renderer.
- **Arabic UI** (KFGQPC-Uthmani 400, 20px / 1.6): Arabic-locale UI strings — title labels in Arabic mode, Arabic settings keys, Arabic CTA copy.

### Named Rules

**The Two-Element Rule.** Arabic letters and Latin/Arabic numerals never share one Text element. The Quranic font wraps digits in scripture ornaments; the UI font does not. Always split: one Text for the label in `theme.fonts.quran`, a sibling Text for the number in `theme.fonts.arabic` (ReemKufi/UI Arabic) or `theme.fonts.latin`.

**The textAlign-Left Rule (RTL).** Under `I18nManager.forceRTL(true)`, React Native flips `textAlign`. To land Arabic text on the physical right, write `textAlign: 'left'` paired with `writingDirection: 'rtl'`. Writing `textAlign: 'right'` puts the text on the physical left and is a bug.

**The Editorial-Once Rule.** Fraunces appears in exactly one place: the splash subtitle. Adding a second use is a violation. Use Manrope or KFGQPC-Uthmani everywhere else.

## 4. Elevation

The system is flat by default. Depth is conveyed primarily through tonal layering between three paper steps (`paper-light` raised, `madani-paper-cream` page, `paper-deep` sunken) and a hairline border the same color as ink at 10% alpha. Shadows appear only when an element is genuinely floating above the page.

The shadow scale is warm-tinted: every shadow uses Mushaf Ink (`#0E2724`) as its color, never neutral grey. This keeps the cast warm and consistent with the paper.

### Shadow Vocabulary
- **shadow1** (`box-shadow: 0 1px 2px rgba(14,39,36,0.06)`): The lightest lift. The active pill on `PillTabs`, settings cards. Almost imperceptible at rest.
- **shadow2** (`box-shadow: 0 4px 10px rgba(14,39,36,0.08)`): The GreetingCard, the Settings profile card, the Practice verse box. The general-purpose card lift.
- **shadow3** (`box-shadow: 0 10px 24px rgba(14,39,36,0.12)`): Reserved for transient overlays (toasts, snackbars). Rare.
- **shadowFloat** (`box-shadow: 0 16px 40px rgba(14,39,36,0.22)`): A single use. The Practice mic FAB above the bottom-tab bar.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. List rows, tab bars, settings rows, and the mushaf page itself never carry shadow. Lift is reserved for elements that genuinely float (cards detached from the list, the FAB, transient overlays).

**The One Ceremonial Lift Rule.** Exactly one element on the entire app uses `shadowFloat`: the Practice mic FAB. Its lift is the ritual gesture that says "begin recitation." Adding a second `shadowFloat` anywhere — bottom sheets, modals, secondary FABs — dilutes the gesture and is forbidden.

**The Hairline Over Shadow Rule.** When a row needs separation from its neighbors, prefer a 1px hairline at `mushaf-ink` 10% alpha over a shadow. Hairlines compose with paper; shadows imply weight.

## 5. Components

### Buttons
- **Shape:** Gently curved (radius 14px / `{rounded.md}`) for primary buttons; tighter (radius 8px / `{rounded.sm}` plus +4px = 12px effective) for the GreetingCard accent CTA. No fully square buttons.
- **Primary:** Sajjada Teal background, Paper Light text, Manrope 600/700, 10/20px padding. Pressed state shifts to Sajjada Teal Pressed.
- **Accent (gold):** Reserved for the GreetingCard "Resume" / "Start" CTA. Sarlawh Gold background, Mushaf Ink text. Pressed state uses Sarlawh Gold Deep. Never use this style for generic primary actions; it dilutes the One Voice Rule.
- **Ghost / Tertiary:** Inline Pressables with no chrome. Used for settings nav rows, list items.

### Pill Tabs (Segmented Selector)
- **Style:** A sunken Paper Deep track, fully rounded (`{rounded.xl}` 28px), 4px inner padding. Inactive pills are transparent with Mushaf Ink Soft labels; the active pill takes Sajjada Teal background, Paper Light text, and `shadow1`.
- **Behavior:** Used on Home for Surahs / Juz / Bookmarks segmentation. Never use for primary navigation — that's the bottom tab bar.

### Surah / Juz List Items
- **Shape:** Rounded medium (`{rounded.md}` 14px), 14px padding, 10px outer margin, 2px vertical gap.
- **Layout:** Three-column row (RTL: leading rosette / center stack / trailing ayat count). The KhatamStar rosette badge wraps a 1px gold/teal stroke around the surah numeral.
- **Active state:** Sajjada Tint Overlay (10% teal) ground + a 3px Sajjada Teal vertical bar pinned to the leading edge (right in RTL, left in LTR). Primary name shifts to Sajjada Teal.
- **Interaction:** Single-tap selects (visual mark), double-tap opens. 300ms debounce. Long-press also opens.

### GreetingCard (Signature)
- **Shape:** Rounded large (`{rounded.lg}` 20px effective; 28px - 6px in code), full-bleed gradient.
- **Background:** Linear gradient at 135°: Sajjada Teal Focus → Sajjada Teal at 55% → Sajjada Teal at 100%. Top-left carries an SVG radial highlight in Sarlawh Gold Soft at 18% opacity.
- **Type:** Latin variant uses Manrope 700 22px title + uppercase 10px label with 0.22em tracking. Arabic variant swaps to KFGQPC-Uthmani at 24/30px and lifts the title to 24px with 40px line-height (the Quranic script needs the breathing room).
- **CTA:** Accent button (Sarlawh Gold), inline on the right of the row.

### Settings Rows
- **Shape:** Stacked rows separated by `StyleSheet.hairlineWidth` borders in Mushaf Ink 10% alpha. No card background; the rows sit on a Paper Light raised surface. Last row in a group has no border.
- **Icon Wrap:** A 34×34px Sajjada Tint Overlay tile, radius 10px, holding the icon glyph. The tinted tile is the only ground in the row.
- **Interaction:** Pressed state dims to 0.7 opacity. Trailing chevron uses Mushaf Ink Subtle, with the path direction flipping by locale (`m9 6 6 6-6 6` LTR, `m15 6-6 6 6 6` RTL).

### Bottom Tab Bar
- **Layout:** Five cells in a `1fr · 1fr · 72px · 1fr · 1fr` grid: Home, Surahs, FAB slot, Review, Profile.
- **Style:** Paper Light raised surface with a hairline top border, 8px horizontal padding, iOS bottom inset of 28px to clear the home indicator.
- **Icon stroke:** 1.75px on a 22×22px viewport. Active uses Sajjada Teal; inactive uses Mushaf Ink Subtle.
- **Labels:** Manrope 700, 9px, 1.2em tracking. Quiet by design.

### Practice Mic FAB (Signature)
- **Shape:** 60px circle, fully rounded (`{rounded.pill}`), Sajjada Teal background, 3px Paper Light border, `shadowFloat` cast.
- **Halo:** A 70px ring in Sarlawh Gold Soft at 50% opacity, set 5px outside the FAB. The halo is always present at rest, brightening slightly on press. This is the **single ceremonial lift** in the entire app.
- **Position:** Floats 22px above the bottom tab bar, centered.

### Ornament Divider (Signature)
- **Style:** A horizontal Sarlawh Gold rule with a central medallion (`assets/svg/ornament-divider.svg`). Replaces every section break that would otherwise be a `<hr>` or a horizontal stroke.
- **Use:** Surah/Juz transitions on the Reader, "Coming Soon" placeholder on Review, the Practice Mode verse-box top border, and the splash separator above the Fraunces subtitle.
- **Forbidden:** A flat 1px Sajjada Teal stroke anywhere in place of an ornament.

### Ayah Rosette
- **Style:** A filled 8-point khātam star or rosette in Sarlawh Gold over Madani Paper Cream, with the ayah numeral inset in Mushaf Ink. Replaces every Unicode `۝` ayah-end marker in the WebView mushaf.

### KhatamStar Badge
- **Style:** A 44×44px 8-point star outline around the surah number on list rows. Stroke = Sarlawh Gold (or Sajjada Teal when active); fill = Madani Paper Cream; numeral inside is Manrope 700 13px in the same stroke color.

## 6. Do's and Don'ts

### Do:
- **Do** use `theme.semantic.*` tokens via `useTheme()` rather than `theme.palette.*` directly. Semantic tokens auto-resolve light vs. night reading modes; palette stops do not.
- **Do** split Arabic letters and numerals into separate Text elements. KFGQPC-Uthmani wraps digits in ayah-marker ornaments; ReemKufi/Manrope render them as plain numerals.
- **Do** use `textAlign: 'left'` paired with `writingDirection: 'rtl'` for Arabic text. Under `I18nManager.forceRTL(true)`, `textAlign: 'right'` lands on the physical left and is a bug.
- **Do** reach for the ornament divider (`OrnamentDivider`) for every section break that would otherwise be a flat rule.
- **Do** keep the GreetingCard the only gradient in the entire app. Its Sajjada Teal Focus → Sajjada Teal → Sajjada Teal radial-glow gradient is signature.
- **Do** use Sajjada Tint Overlay (the 10% teal) for the selected surah/juz row ground. Pair it with a 3px vertical Sajjada Teal active-edge bar.
- **Do** vary spacing for rhythm. Use `theme.gutter.screen` (24px) for screen edges, `theme.gutter.row` (16px) between rows, `theme.gutter.ayah` (28px) inside scripture surfaces.
- **Do** verify every UI change on the iOS simulator, not on the web build. RN-web flattens shadows, breaks the SQLite hooks, and skips `react-native-pager-view`.

### Don't:
- **Don't** use `#000` or `#fff` anywhere. Every neutral is tinted toward paper warmth (Mushaf Ink `#0E2724` for ink, Madani Paper Cream `#F5EEDB` for surfaces).
- **Don't** repeat the **web-SaaS chrome** trap of Quran.com — no tabbed page headers, no sidebars, no settings panels surrounding the mushaf. The mushaf is not a settings panel.
- **Don't** repeat the **AI-startup gloss** trap of Tarteel — no streak counters, no "AI-powered" badges, no neon-on-dark hero cards, no gradient text. Recitation feedback is a sheikh's quiet correction, not an arcade.
- **Don't** repeat the **Islamic-clipart** trap of SalamWeb — no crescents, no mosque silhouettes, no primary emerald green, no clip-art calligraphy. Use authentic Madani-mushaf geometry: sarlawh, ayah rosettes, the project's Kufic glyph.
- **Don't** repeat the **prayer-time-app feature creep** trap — no Kaaba photos, no Qibla compass, no prayer-times widget, no zakat calculator, no hijri calendar. The app does one thing: read and recite.
- **Don't** add a second `shadowFloat` element. The Practice FAB is the only floating element on the entire app. Bottom sheets use `shadow3`; cards use `shadow2`; list rows use no shadow.
- **Don't** apply Sarlawh Gold beyond ≤10% of any screen. It's an ornament accent, not a brand color. The button-accent style is reserved for the GreetingCard CTA — generic primary actions use Sajjada Teal.
- **Don't** use Fraunces outside the splash subtitle. One use, ever.
- **Don't** use side-stripe borders (border-left/right > 1px) as decorative accents. The active surah-row vertical bar is positioned absolute as a 3px element, not a border-left.
- **Don't** use gradient text. The GreetingCard title is solid Paper Light; emphasis comes from weight and size.
- **Don't** use modals as a first thought. Settings choosers and ayah actions should be inline or progressive. Modal-as-default is laziness.
- **Don't** use identical card grids of icon-+-heading-+-text tiles. The Home screen uses a list of variable-density rows, not a grid of cards.
- **Don't** use em dashes in copy. Use commas, colons, semicolons, periods, or parentheses. Also not `--`.
