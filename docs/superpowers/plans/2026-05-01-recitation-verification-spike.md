# Recitation Verification Spike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove a repo-native Quran memorization verification path before committing the product epic to a full ASR implementation.

**Architecture:** Keep the current Expo/React Native app and add a narrow verification boundary: ASR adapters produce transcript chunks, a deterministic comparison engine advances through canonical Quran tokens, and the practice UI consumes session state. The spike starts with Al-Fatiha/Juz Amma, text-only fixtures, and measurable gates before adding native microphone inference.

**Tech Stack:** Expo SDK 55, React Native 0.83, TypeScript, Jest, `expo-sqlite`, `expo-haptics`, MMKV/Zustand, later `whisper.rn` or `react-native-executorch` behind an adapter.

**Research Input:** `_bmad-output/planning-artifacts/research/technical-quran-memorization-verification-app-research-2026-03-18.md`

---

## Decision Summary

- Keep Expo/React Native for the epic unless an ASR spike proves a blocker.
- Do not migrate to Flutter for the MVP; the existing app already has native dev-client workflows, Quran data, haptics, RTL, audio playback, and a practice screen.
- Treat on-device ASR accuracy and latency as measured gates, not assumed facts.
- Build comparison and state-machine logic first because it is independent of the winning ASR backend.
- Defer diacritic/tajweed feedback until base-word detection is trustworthy.

## File Map

| File | Responsibility |
|---|---|
| `docs/superpowers/plans/2026-05-01-recitation-verification-spike.md` | This implementation plan and gate checklist |
| `docs/superpowers/specs/2026-05-01-recitation-verification-adr.md` | Repo-specific architecture decision and ASR adapter comparison |
| `src/services/verification/quranTextNormalizer.ts` | Normalize Uthmani/ASR Arabic into comparison-safe text and tokens |
| `src/services/verification/tasmeeaMatcher.ts` | Sliding-window edit-distance alignment and error classification baseline |
| `src/services/verification/types.ts` | Stable types for transcript chunks, reference tokens, and match results |
| `src/services/verification/__tests__/quranTextNormalizer.test.ts` | Normalization behavior tests |
| `src/services/verification/__tests__/tasmeeaMatcher.test.ts` | Matcher behavior tests |
| `src/data/types.ts` | Later: add `QuranWordToken` when SQLite word-text exists |
| `src/data/quranRepository.ts` | Later: add word-token queries after the DB schema is extended |
| `src/app/practice.tsx` | Later: replace demo words with verification session state |

---

### Task 1: Repo-Specific Architecture Decision

**Files:**
- Create: `docs/superpowers/specs/2026-05-01-recitation-verification-adr.md`

- [x] **Step 1: Document the decision**

Create an ADR that records:
- current repo stack
- why Flutter is rejected for this epic
- candidate ASR adapters
- first measurable gates
- the next implementation order

- [ ] **Step 2: Review before native dependency install**

Before installing any ASR package, verify its Expo SDK 55/RN 0.83 compatibility and whether it requires custom native config or a dev-client rebuild.

### Task 2: Quran Text Normalization

**Files:**
- Create: `src/services/verification/types.ts`
- Create: `src/services/verification/quranTextNormalizer.ts`
- Test: `src/services/verification/__tests__/quranTextNormalizer.test.ts`

- [x] **Step 1: Write failing tests**

Test that Uthmani marks, tatweel, Arabic presentation differences, and whitespace normalize to stable base tokens.

- [x] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- --runTestsByPath src/services/verification/__tests__/quranTextNormalizer.test.ts
```

Expected: FAIL because the module does not exist.

- [x] **Step 3: Implement minimal normalizer**

Create the types and normalizer needed by the tests.

- [x] **Step 4: Run test to verify it passes**

Run the same test command and expect PASS.

### Task 3: Tasmeea-Style Matcher Baseline

**Files:**
- Create: `src/services/verification/tasmeeaMatcher.ts`
- Test: `src/services/verification/__tests__/tasmeeaMatcher.test.ts`

- [x] **Step 1: Write failing matcher tests**

Cover exact matches, skipped words, wrong words, and repeated words.

- [x] **Step 2: Implement edit-distance and token-window matching**

Return a result with:
- `status: 'match' | 'mismatch' | 'incomplete'`
- `expectedIndex`
- `observedTokens`
- `confidence`
- `errorType?: 'wrong-word' | 'skipped-word' | 'repeated-word'`

- [x] **Step 3: Run matcher tests**

Run:

```bash
npm test -- --runTestsByPath src/services/verification/__tests__/tasmeeaMatcher.test.ts
```

Expected: PASS.

### Task 4: Quran Word-Token Data Spike

**Files:**
- Modify: `src/data/seed/buildQuranDb.ts`
- Modify: `src/data/quranRepository.ts`
- Modify: `src/data/types.ts`
- Test: `src/data/__tests__/quranRepository.verificationWords.test.ts`

- [ ] **Step 1: Decide source**

Use Quran Foundation `word_fields=text_uthmani,text_uthmani_simple,text_imlaei_simple,verse_key,location` or QUL export, then persist locally.

- [ ] **Step 2: Add schema**

Add a `quran_words` table separate from `mushaf_words` so display layout and verification tokens do not conflict.

- [ ] **Step 3: Add repository query**

Expose `getVerificationWordsByRange(surah, startAyah, endAyah)`.

### Task 5: ASR Adapter Spike

**Files:**
- Create: `src/services/verification/asrAdapter.ts`
- Create: `src/services/verification/asrAdapters/mockAsrAdapter.ts`
- Later create one native adapter after compatibility check.

- [ ] **Step 1: Define interface**

Use a minimal interface:

```ts
export interface AsrAdapter {
  start(options: { language: 'ar'; sampleRate: 16000 }): Promise<void>;
  stop(): Promise<void>;
  subscribe(listener: (chunk: TranscriptChunk) => void): () => void;
}
```

- [ ] **Step 2: Compare native candidates**

Compare `whisper.rn` and `react-native-executorch` on iOS simulator/device for:
- setup complexity
- Arabic/multilingual model support
- streaming behavior
- chunk latency
- memory and app size

### Task 6: Al-Fatiha Vertical Slice

**Files:**
- Modify: `src/app/practice.tsx`
- Add session store only if the UI needs cross-component state.

- [ ] **Step 1: Replace demo constants**

Load Al-Fatiha ayah 2 verification tokens from the repository or a fixture.

- [ ] **Step 2: Feed mock transcript chunks**

Use the mock ASR adapter to drive word states in the UI.

- [ ] **Step 3: Trigger haptics on mismatch**

Use `expo-haptics` first; only add custom native haptic patterns if product testing proves the simple signals insufficient.

## Gates Before Full Epic

- ASR candidate can run in the current Expo dev-client workflow on iOS.
- Al-Fatiha transcript-to-haptic latency is measured and p95 is under 2 seconds on a real device.
- Base-word false positives are under 10% on a small manually reviewed test set.
- The SQLite word-token source is authoritative enough for Hafs/Uthmani comparison.
- The practice UI can recover from repeats, pauses, and self-correction without trapping the user.
