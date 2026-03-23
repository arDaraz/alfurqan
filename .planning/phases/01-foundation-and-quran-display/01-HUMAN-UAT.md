---
status: partial
phase: 01-foundation-and-quran-display
source: [01-VERIFICATION.md]
started: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Arabic Uthmani text renders correctly on physical device
expected: Full diacritics visible (kasra, fatha, shadda, etc.), no clipping between diacritic marks and lines above/below, KFGQPC Uthmani font (mushaf-style, not generic Arabic) clearly distinguished from system fonts, 28px display size with 2.2x line height feels readable and reverent
result: [pending]

### 2. End-to-end navigation flow works on device
expected: Fresh install — swipe through all 3 onboarding screens — tap "Get Started" — home screen loads 114 surahs — tap "Al-Baqarah" — reader opens — tap "Juz" tab — tap Juz 2 — navigates to correct surah. Every transition works without crash or blank screen.
result: [pending]

### 3. Ayah range selection visual feedback
expected: Tapped ayah shows teal left-border highlight, second tap highlights the range with teal background, RangeSelectionBar slides up from bottom with correct text and buttons
result: [pending]

### 4. Scroll restore to last-read ayah on surah re-open
expected: After reading to ayah 30 of Al-Baqarah, close the reader, reopen — FlashList scrolls to ayah 30 via scrollToIndex, not the surah top. 100ms delay fires correctly on both iOS and Android.
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
