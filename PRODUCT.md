# Product

## Register

product

## Users

Arabic- and/or English-speaking Muslims practicing daily Qur'an reading and recitation (tasmīʿ). The audience spans Hifz students, qari trainees, and lay readers — anyone who wants a quiet, reverent mushaf and a discreet coach for self-correction.

They are usually reading in private — early morning after Fajr, after Maghrib, before sleep — phone in lap or set on a table. The session is short and devotional, not a feed scroll. They want a single page of scripture and the silence around it; they do not want feedback theater.

## Product Purpose

A native iOS/Android app that renders an authentic 604-page Madani mushaf with the same line-breaks and glyph spacing as the print edition, plus a Practice Mode that listens to recitation and quietly flags miscues.

The app is ad-free, gamification-free, and notification-light. Success is when a user opens the app, reads or recites without distraction, and closes it. Repeat use is a side effect of usefulness, not the goal. The product never competes for attention against the scripture it displays.

## Brand Personality

**Disciplined. Focused. Monastic.**

The voice is quiet, exact, and bilingual. Copy is short and precise — Arabic-first on reverent surfaces (the mushaf, ayah markers, surah titles), Latin-first only in functional chrome (settings, search, error states). Typography is the loudest brand voice; everything else yields to it. The interface should feel like a study desk and a prayer rug, not a product.

## Anti-references

Each rejection names a specific failure mode in the category, not a vague "looks bad."

- **Quran.com (web)** — rejected for *web-SaaS chrome*. Tabbed page headers, sidebar nav, and a "translation / reciter / audio" hierarchy that crowds the scripture with controls. The mushaf is not a settings panel; chrome should disappear, not surround.
- **Tarteel** — rejected for *AI-startup gloss*. Gamified streaks, "AI-powered" badge language, neon-on-dark overstimulation, gradient hero cards. Recitation review should feel like a sheikh's quiet correction, not an arcade scoring screen.
- **SalamWeb** — rejected for *Islamic clipart and primary green*. Mosque silhouettes, crescent-and-star ornaments, generic emerald palette. Authentic Madani-mushaf geometry replaces all of it — sarlawh frames, real ayah-end medallions, the project's hand-drawn Kufic rosette glyph.
- **Generic prayer-time apps (Athan Pro, Muslim Pro, etc.)** — rejected for *feature creep and photographic religious imagery*. Kaaba hero photos, Qibla compass tiles, prayer-times widgets, zakat calculators, ad chrome. Mushaf Al Furqan does one thing: read and recite. No prayer times, no qibla, no hijri calendar.

## Design Principles

Strategic, not visual. Each principle exists so a future design decision can resolve "should we add X?" without re-asking.

1. **Reverence over engagement.** No streaks-as-pressure, no FOMO notifications, no leaderboards, no "you're on fire" celebration. Practice is the verb; metrics are private and quiet. If a feature increases time-in-app at the cost of devotional feel, cut it.
2. **The mushaf is sacred surface; chrome is invisible.** Reader chrome is quiet at rest, transient on tap, and never floats over scripture. Toolbars use the lowest contrast that remains legible. The user looks at scripture, not at the app.
3. **Authentic craft, not Islamic clipart.** Every ornament traces back to real mushaf geometry — sarlawh, ayah-end medallions, the project's Kufic glyph. No crescents, mosque silhouettes, photographic holy sites, or clip-art calligraphy.
4. **Discipline over gloss.** Restrained motion, sober palette, precise type. The app should feel like a study desk and a prayer rug — not a SaaS dashboard or an AI demo. Bias toward "less, but exact" over "more, but stylish."
5. **RTL-first, bilingual.** Arabic is the primary text; Latin is the visitor. Layout, numerals, and copy default to Arabic, and Latin chrome adapts to it. RTL is never a flipped LTR afterthought.

## Accessibility & Inclusion

WCAG 2.2 AA target across both the light "paper" and dark "night reading" themes. Concrete commitments:

- **Dynamic type.** Honor iOS Dynamic Type and Android font scale. The in-app mushaf font slider already covers scripture sizing; UI labels and body copy must also respond to system text size.
- **Reduced motion.** Honor `prefers-reduced-motion` / iOS Reduce Motion. The breathing splash rosette, ambient ornament cycles, and decorative micro-animations turn off. Informational motion (the practice-mode mic visualizer) stays but reduces amplitude.
- **State communicated by more than color.** Practice-mode word states (sage = correct, rose = miscue) must also carry an icon, weight, or underline so red/green-blind users can distinguish them. Same rule applies to success/danger toasts and chips.
- **Touch targets ≥ 44×44pt** per Apple HIG. The reader's bottom toolbar is particularly vulnerable to undersized hits; verify on every shape pass.
- **RTL parity.** RTL is the primary layout, not a flipped LTR. Eastern-Arabic numerals pair with Arabic labels; Latin numerals pair with Latin labels. Touch-target ordering must be tested under both numeral settings.
- **Low-literacy onboarding.** Onboarding leads with image and ornament, not paragraphs. Bilingual alternation per slide; no dense text walls.
