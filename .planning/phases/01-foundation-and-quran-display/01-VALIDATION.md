---
phase: 1
slug: foundation-and-quran-display
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ships with Expo SDK 55 via jest-expo) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npx jest --passWithNoTests` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --passWithNoTests`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | QTEXT-01 | integration | `npx jest tests/data/quranRepository.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | QTEXT-01 | smoke | Manual: verify font renders on device | Manual-only | ⬜ pending |
| 01-02-01 | 02 | 1 | QTEXT-02 | unit | `npx jest tests/hooks/useSurahList.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | QTEXT-02 | unit | `npx jest tests/hooks/useJuzList.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-02-03 | 02 | 1 | QTEXT-02 | unit | `npx jest tests/hooks/useSearch.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | QTEXT-03 | unit | `npx jest tests/stores/selectionStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 2 | QTEXT-04 | unit | `npx jest tests/stores/readingStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-05-01 | 05 | 1 | UI-01 | unit | `npx jest tests/constants/theme.test.ts -x` | ❌ W0 | ⬜ pending |
| 01-06-01 | 06 | 3 | UI-04 | unit | `npx jest tests/stores/readingStore.test.ts -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest.config.js` — Jest configuration with jest-expo preset, TypeScript transform
- [ ] `tests/data/quranRepository.test.ts` — Tests for SQLite data access (surah count, ayah count, data integrity)
- [ ] `tests/hooks/useSurahList.test.ts` — Tests for surah list hook
- [ ] `tests/hooks/useJuzList.test.ts` — Tests for juz list hook
- [ ] `tests/hooks/useSearch.test.ts` — Tests for search filtering logic
- [ ] `tests/stores/selectionStore.test.ts` — Tests for ayah range selection state
- [ ] `tests/stores/readingStore.test.ts` — Tests for last-read position and onboarding flag persistence
- [ ] `tests/constants/theme.test.ts` — Tests that theme tokens match UI-SPEC values
- [ ] `tests/utils/arabic.test.ts` — Tests for Arabic-Indic numeral conversion, text utilities
- [ ] Framework install: `npm install -D jest jest-expo @types/jest ts-jest` — if not included by create-expo-app

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Arabic font renders correctly with diacritics | QTEXT-01 | Font rendering requires real device — simulators may not match device text shaping | Load Al-Fatiha on physical iOS + Android. Verify diacritics are not clipped, ligatures form correctly, line height prevents collisions. |
| FlashList RTL rendering on Android | QTEXT-02 | FlashList RTL layout is device-specific behavior | Scroll through surah list and ayah list on physical Android device. Verify items appear in correct order, no layout jumps. |
| Ornamental ayah markers display correctly | UI-01 | Unicode symbol rendering varies by device | Verify ۝ symbol renders with Arabic-Indic numerals inside on both platforms. |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
