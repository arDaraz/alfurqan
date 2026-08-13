## Reassessment

The original research is still useful for the **core product idea**: offline-first recitation verification, constrained matching against a selected Quran scope, local Quran text data, haptic feedback, and a Tasmeea-style alignment approach. The outdated part is the **implementation stack**: the old recommendation centered on Flutter, while your current project is already a React Native Mushaf app. I would keep the product architecture and replace the implementation strategy. 

The biggest correction: **memorization checking and tajweed evaluation should not share the same engine**.

**Memorization checking** is primarily a constrained transcript-alignment problem: listen, produce candidate words, align them to the selected ayah/page/surah, then detect omitted, added, substituted, repeated, or jumped text.

**Tajweed evaluation** is a pronunciation-assessment problem: it needs audio timing, phoneme-level alignment, rule-specific classifiers, and confidence thresholds. It should not be treated as “ASR plus string comparison.”

For React Native, the recitation layer should be built as a native-first subsystem exposed to TypeScript. React Native’s New Architecture matters here because JSI removes the old asynchronous bridge and allows native/C++ objects and audio samples to cross the JS/native boundary without bridge serialization costs; TurboModules also give you typed native module specs through Codegen. ([React Native][1])

## Recommended React Native stack for the recitation module

| Layer                         | Recommendation                                                                                 | Notes                                                                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App framework                 | React Native + TypeScript                                                                      | Keep current project. Enable New Architecture.                                                                                                                                                                                       |
| Expo strategy                 | Expo Development Build / prebuild, not Expo Go                                                 | Recitation needs native libraries and possibly custom native code. Expo docs state Expo Go has a fixed set of native libraries, while development builds let you include custom native code/configuration. ([Expo Documentation][2]) |
| Audio capture                 | `react-native-audio-api` or custom TurboModule                                                 | Prefer raw PCM buffers, 16 kHz mono, small chunk sizes. React Native Audio API supports recorder callbacks with sample rate, buffer length, and channel count. ([Software Mansion][3])                                               |
| Text ASR                      | `whisper.rn` as primary PoC path                                                               | It is a React Native binding for `whisper.cpp` and includes `RealtimeTranscriber` with VAD, auto-slicing, and memory management. ([GitHub][4])                                                                                       |
| Alternative ASR research path | React Native ExecuTorch                                                                        | It supports STT models and streaming-style APIs, but benchmark memory usage is high for mobile; treat it as a later comparison track, not the default MVP path. ([Software Mansion][5])                                              |
| Quran data                    | Use your existing Mushaf data if it has stable word IDs; otherwise use QUL or Quran Foundation | Quran Foundation exposes `text_uthmani`, `text_uthmani_tajweed`, and word-level fields; QUL provides Uthmani word-by-word data with word positions. ([Quran Foundation][6])                                                          |
| Storage                       | SQLite for Quran/session data, MMKV for settings/runtime prefs                                 | SQLite for structured session results; MMKV for fast user settings and model/session config.                                                                                                                                         |
| Feedback                      | Visual + haptic                                                                                | Use haptics as assistive only; Expo Haptics supports Android vibration and iOS Taptic Engine, but iOS haptics may do nothing in Low Power Mode or when user settings disable it. ([Expo Documentation][7])                           |
| Tajweed model                 | Separate phoneme/rule pipeline                                                                 | Iqra’Eval 2025 frames Quranic pronunciation assessment as mispronunciation detection/diagnosis, and recent Quranic work uses phoneme-level and sifa-level representations rather than plain text ASR. ([ACL Anthology][8])           |

---

# PRD: Recitation Evaluation Module for React Native Mushaf App

## 1. Product summary

The recitation evaluation module adds listening, alignment, and feedback capabilities to the existing React Native Mushaf app. The module supports two distinct processes:

1. **Memorization checking**: verify whether the recited words match the selected Quran text.
2. **Recitation/tajweed evaluation**: evaluate pronunciation quality, tajweed rules, elongation, nasalization, articulation, and phonetic correctness.

The first release should prioritize **memorization checking**. Tajweed evaluation should be introduced later as a rule-specific, confidence-scored system, initially in after-ayah or after-session reporting rather than aggressive real-time correction.

## 2. Problem statement

Users practicing memorization need a digital partner that follows the selected Quran scope and alerts them when they make textual mistakes. Existing Mushaf-only functionality helps reading and navigation, but it does not validate whether the user is reciting correctly from memory.

The product must help users catch:

* omitted words,
* added words,
* substitutions,
* repeated segments,
* jumps to another ayah or similar passage,
* long pauses that may indicate forgetting,
* later: pronunciation and tajweed issues.

The system must be conservative. A false correction during Quran recitation is more damaging than a missed correction. The app should prefer “uncertain” over confidently marking a correct recitation as wrong.

## 3. Goals

### Product goals

| Goal | Description                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------- |
| G1   | Allow the user to select a bounded Quran scope: ayah, range, surah, page, hizb, or juz section.   |
| G2   | Listen to recitation and compare it against the expected text within that selected scope.         |
| G3   | Detect text-level memorization errors with clear classification.                                  |
| G4   | Provide low-disruption feedback through word highlighting, subtle haptics, and session review.    |
| G5   | Preserve privacy by keeping the core flow on-device where practical.                              |
| G6   | Establish an extensible foundation for tajweed evaluation without blocking the text-checking MVP. |

### Technical goals

| Goal | Description                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| T1   | Use React Native as the app layer and native modules for audio/model inference.                  |
| T2   | Use constrained alignment rather than free-form transcription.                                   |
| T3   | Keep Quran reference data indexed at word level.                                                 |
| T4   | Store recitation sessions locally with enough detail for progress tracking and model evaluation. |
| T5   | Support a future tajweed engine that can operate on confirmed text-aligned audio segments.       |

## 4. Non-goals

The first production version should not attempt to:

* certify a user’s recitation,
* replace a qualified Quran teacher,
* evaluate maqamat, melody, or beautification,
* provide fatwa-like rulings,
* evaluate all tajweed rules in real time,
* support open-ended Arabic dictation outside the selected Quran scope,
* aggressively interrupt the user on low-confidence model output.

## 5. Target users

| Persona                       | Need                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Memorization student          | Wants to practice alone and know when text mistakes happen.                               |
| Hifdh reviewer                | Wants to recite a page/surah from memory and receive mistake logs.                        |
| Parent/teacher assistant user | Wants structured review data for a child/student, not a replacement for human correction. |
| Advanced learner              | Later wants tajweed-specific feedback and rule-level reports.                             |

## 6. Core product principle

**Text first, tajweed second.**

A word must be textually aligned before its tajweed can be evaluated. If the system is unsure whether the user recited the expected word, the tajweed engine should mark that segment as **not evaluated**, not “wrong tajweed.”

## 7. User flow

### 7.1 Memorization checking flow

1. User opens Mushaf.
2. User selects recitation mode.
3. User chooses scope:

   * current ayah,
   * ayah range,
   * current page,
   * surah,
   * custom bookmark range.
4. User chooses display mode:

   * visible Mushaf,
   * hidden words,
   * first-word hints,
   * full memory mode.
5. User taps start.
6. App records audio and streams chunks to the ASR/text engine.
7. App aligns recognized words to the expected word sequence.
8. App updates current word/ayah state.
9. On high-confidence error, app gives visual and optional haptic feedback.
10. User finishes or stops.
11. App shows a session report with mistakes, timestamps, ayah references, and repeat suggestions.

### 7.2 Tajweed evaluation flow

1. User completes an ayah or session.
2. App uses the confirmed text alignment to segment audio by word/phoneme/rule location.
3. App evaluates only supported rules.
4. App produces a report:

   * likely correct,
   * likely issue,
   * not evaluated,
   * low confidence.
5. User can tap a flagged word/rule to replay the segment and view the rule explanation.

Tajweed feedback should initially be **after-ayah** or **after-session**, not immediate haptic feedback, because tajweed false positives are more likely and more disruptive than text mistakes.

---

# 8. Functional requirements: Memorization checking

## 8.1 Scope selection

| ID    | Requirement                                                                                                                        | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------- | -------- |
| M-001 | User can select a bounded recitation scope from the Mushaf.                                                                        | P0       |
| M-002 | Supported MVP scopes: single ayah, ayah range, current page.                                                                       | P0       |
| M-003 | The app loads expected word sequence before recording starts.                                                                      | P0       |
| M-004 | The app prevents free-form recognition outside the selected scope unless jump detection requires checking nearby known references. | P0       |
| M-005 | User can switch between visible text and memorization mode.                                                                        | P1       |

## 8.2 Reference text preparation

Each Quran word should be represented as a stable token:

```text
token_id: surah:ayah:word_index
verse_key: 2:255
surah_id
ayah_number
word_index
page_number
line_number
uthmani_text
tajweed_text
normalized_text
phonetic_hint_optional
```

| ID    | Requirement                                                                                                                  | Priority |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| M-006 | The system must maintain stable word-level IDs.                                                                              | P0       |
| M-007 | The system must store both display text and normalized comparison text.                                                      | P0       |
| M-008 | Normalization must remove Quranic marks/diacritics for base memorization matching but preserve original Uthmani text for UI. | P0       |
| M-009 | Normalization must be configurable because over-normalization can collapse distinct Quran words.                             | P0       |
| M-010 | The system must preserve ayah boundaries and word positions for jump/repeat detection.                                       | P0       |

## 8.3 Audio capture

| ID    | Requirement                                                                                     | Priority |
| ----- | ----------------------------------------------------------------------------------------------- | -------- |
| M-011 | The app records microphone audio with user permission.                                          | P0       |
| M-012 | The app captures or converts audio to mono PCM suitable for the ASR engine.                     | P0       |
| M-013 | Target sample rate: 16 kHz for ASR model compatibility.                                         | P0       |
| M-014 | Audio capture must run without blocking UI rendering.                                           | P0       |
| M-015 | The app must detect silence/long pause intervals.                                               | P1       |
| M-016 | User can disable recording storage; live processing should not require saving full audio files. | P1       |

## 8.4 ASR output handling

| ID    | Requirement                                                                                 | Priority |
| ----- | ------------------------------------------------------------------------------------------- | -------- |
| M-017 | The ASR layer returns partial/final text candidates with timestamps when available.         | P0       |
| M-018 | The app treats ASR output as probabilistic, not authoritative.                              | P0       |
| M-019 | The app should wait for stability before issuing hard corrections.                          | P0       |
| M-020 | The app should support a confidence/strictness setting: lenient, balanced, strict.          | P1       |
| M-021 | The app should log raw ASR candidates locally for debugging when developer mode is enabled. | P2       |

## 8.5 Constrained alignment

The alignment engine should maintain a pointer into the expected word sequence. It should compare recognized candidates only against a sliding window around the current expected word.

Recommended matching model:

```text
current_expected_index = i
search_window = expected_words[i - backtrack_limit : i + forward_limit]

recognized_chunk
  -> normalize
  -> tokenize
  -> align against search_window
  -> classify result
  -> update pointer
```

| ID    | Requirement                                                                                                                                            | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| M-022 | The system must align ASR tokens against the selected Quran scope, not against arbitrary Arabic text.                                                  | P0       |
| M-023 | The system must support sliding-window alignment around the current expected word.                                                                     | P0       |
| M-024 | The system must support backtracking for repeated segments.                                                                                            | P0       |
| M-025 | The system must support forward jumps within the selected scope.                                                                                       | P0       |
| M-026 | The system must detect likely jumps outside the selected scope only as “possible outside-scope recitation,” not hard error, unless confidence is high. | P1       |
| M-027 | The system must classify uncertain alignments separately from mistakes.                                                                                | P0       |

## 8.6 Error classification

| Error type             | Definition                                                     | Example behavior                            |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| Omission               | Expected word not recited, and later expected word appears.    | Highlight skipped word.                     |
| Addition               | Extra word/phrase appears that does not fit expected sequence. | Mark as added segment.                      |
| Substitution           | User says a different word instead of expected word.           | Mark current word as mismatch.              |
| Repetition             | User repeats previous word/phrase.                             | Mark repeated range.                        |
| Jump forward           | User jumps ahead within the selected scope.                    | Mark skipped range and new location.        |
| Jump backward          | User returns to earlier ayah/segment.                          | Mark repeated/backtrack.                    |
| Similar-ayah confusion | User jumps to a similar phrase elsewhere.                      | Mark possible mutashabih jump.              |
| Long pause             | User stops beyond threshold.                                   | Optional hint/haptic nudge.                 |
| ASR uncertainty        | Model output too unstable/low confidence.                      | No correction; show subtle uncertain state. |

| ID    | Requirement                                                                                                          | Priority |
| ----- | -------------------------------------------------------------------------------------------------------------------- | -------- |
| M-028 | The system must classify text mistakes into omission, addition, substitution, repetition, jump, pause, or uncertain. | P0       |
| M-029 | The system must avoid hard correction when ASR confidence or alignment confidence is below threshold.                | P0       |
| M-030 | The system must support repeated phrase detection over multi-word segments, not only single words.                   | P1       |
| M-031 | The system should support mutashabihat-aware jump detection later using known similar passages.                      | P2       |

## 8.7 Feedback

| ID    | Requirement                                                                             | Priority |
| ----- | --------------------------------------------------------------------------------------- | -------- |
| M-032 | The app visually highlights current, correct, skipped, and incorrect words.             | P0       |
| M-033 | The app supports optional haptic feedback on high-confidence text mistakes.             | P0       |
| M-034 | The app must provide a visual fallback for users/devices where haptics are unavailable. | P0       |
| M-035 | Haptic feedback must be configurable or disabled.                                       | P0       |
| M-036 | The app should avoid loud audio feedback during recitation.                             | P1       |
| M-037 | User can tap a mistake in the report to jump to the word/ayah in the Mushaf.            | P1       |

Recommended haptic mapping:

| Event        | Haptic pattern        |
| ------------ | --------------------- |
| Substitution | Single medium pulse   |
| Omission     | Double light pulse    |
| Jump         | Strong single pulse   |
| Long pause   | Gentle periodic nudge |
| Uncertain    | No haptic             |

## 8.8 Session report

| ID    | Requirement                                                                         | Priority |
| ----- | ----------------------------------------------------------------------------------- | -------- |
| M-038 | The app shows session duration, selected scope, completed ayahs, and text accuracy. | P0       |
| M-039 | The app lists mistakes by ayah, word, error type, and timestamp.                    | P0       |
| M-040 | The app lets the user replay mistake audio if recording storage is enabled.         | P1       |
| M-041 | The app stores mistake history locally for progress tracking.                       | P1       |
| M-042 | The app suggests retrying ayahs with repeated errors.                               | P2       |

---

# 9. Functional requirements: Tajweed evaluation

## 9.1 Tajweed scope

Tajweed evaluation is a separate product capability. It should only run on text-aligned segments. Iqra’Eval 2025 is directly relevant because it frames Quranic pronunciation assessment as mispronunciation detection and diagnosis with localization; newer Quranic pronunciation work also points toward phoneme-level and articulation-level modeling, not plain word-level ASR. ([ACL Anthology][8])

## 9.2 Supported evaluation states

Every evaluated rule instance should return one of:

| State          | Meaning                                                |
| -------------- | ------------------------------------------------------ |
| Passed         | The system believes the rule was applied correctly.    |
| Likely issue   | The system detected a probable error.                  |
| Not evaluated  | Text alignment or audio quality was insufficient.      |
| Unsupported    | Rule is not yet supported by the current model.        |
| Low confidence | Model produced a weak result; do not count as mistake. |

## 9.3 Rule extraction

| ID    | Requirement                                                                         | Priority |
| ----- | ----------------------------------------------------------------------------------- | -------- |
| T-001 | The system must extract expected tajweed rule locations from Quran reference data.  | P0       |
| T-002 | The system must attach rule instances to word IDs and phoneme spans where possible. | P0       |
| T-003 | The system must know which rules are supported by the current model version.        | P0       |
| T-004 | Unsupported rules must not be shown as failed.                                      | P0       |

Rule instance structure:

```text
rule_instance_id
token_id
rule_type
expected_duration_optional
expected_phoneme_pattern_optional
expected_sifa_optional
start_word_id
end_word_id
support_status
```

## 9.4 Initial tajweed rules

For a practical alpha, start with a small set where audio signals are more measurable:

| Rule family              | Evaluation approach                                           | Release    |
| ------------------------ | ------------------------------------------------------------- | ---------- |
| Madd / elongation        | Duration estimate against expected harakat range.             | Alpha      |
| Ghunnah                  | Nasalization/segment classifier around noon/meem contexts.    | Alpha/Beta |
| Qalqalah                 | Burst/release pattern classifier.                             | Beta       |
| Ikhfaa / Idgham / Iqlaab | Context-specific classifier around noon sakinah/tanween/meem. | Beta       |
| Makharij substitutions   | Phoneme-level mispronunciation detection.                     | Later      |
| Sifat-level articulation | Phoneme+sifa model.                                           | Later      |

## 9.5 Audio segmentation for tajweed

| ID    | Requirement                                                                                                       | Priority |
| ----- | ----------------------------------------------------------------------------------------------------------------- | -------- |
| T-005 | Tajweed evaluation must use only confirmed text-aligned audio.                                                    | P0       |
| T-006 | The system must segment audio at ayah, word, and later phoneme/rule level.                                        | P0       |
| T-007 | The system should use forced alignment or model timestamps where available.                                       | P1       |
| T-008 | The system must mark segments as not evaluated when background noise, clipping, or alignment uncertainty is high. | P0       |

## 9.6 Tajweed feedback UX

| ID    | Requirement                                                                                                  | Priority |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- |
| T-009 | Tajweed feedback appears after ayah/session in the first release, not as disruptive live correction.         | P0       |
| T-010 | User can tap a flagged rule to see the word, rule name, likely issue, and replay segment.                    | P1       |
| T-011 | Feedback copy must avoid overclaiming; use “possible issue” or “review this” unless confidence is very high. | P0       |
| T-012 | The app must distinguish text mistakes from tajweed mistakes visually.                                       | P0       |
| T-013 | The app must support teacher-reviewed corrections later.                                                     | P2       |

Example feedback:

```text
Ayah 1:4
Word: مَـٰلِكِ
Rule: Madd
Result: Possible short elongation
Confidence: Medium
Action: Replay / Practice word / Mark as reviewed
```

## 9.7 Tajweed scoring

| ID    | Requirement                                                                       | Priority |
| ----- | --------------------------------------------------------------------------------- | -------- |
| T-014 | The app calculates tajweed score only from evaluated supported rule instances.    | P0       |
| T-015 | Unsupported and low-confidence instances must be excluded from score denominator. | P0       |
| T-016 | The app shows rule-specific scores, not only one global score.                    | P1       |
| T-017 | The app tracks repeated rule weaknesses over time.                                | P2       |

---

# 10. System architecture

## 10.1 Module architecture

```text
React Native UI
  ├─ Mushaf display
  ├─ Recitation controls
  ├─ Live feedback layer
  └─ Session report

Domain layer
  ├─ RecitationSessionService
  ├─ MemorizationAlignmentService
  ├─ TajweedEvaluationService
  ├─ FeedbackPolicyService
  └─ ProgressService

Native / ML layer
  ├─ AudioCaptureModule
  ├─ ASRModule
  ├─ Optional ForcedAlignmentModule
  └─ Optional TajweedModelModule

Data layer
  ├─ QuranReferenceRepository
  ├─ SessionRepository
  ├─ UserSettingsRepository
  └─ ModelAssetRepository
```

## 10.2 Runtime pipeline

```text
Microphone
  -> PCM audio chunks
  -> ASR / token candidate stream
  -> normalized token stream
  -> constrained Quran alignment
  -> text error classification
  -> UI + haptic feedback
  -> session event log

Confirmed aligned audio
  -> word/rule segmentation
  -> tajweed rule evaluation
  -> confidence filtering
  -> tajweed report
```

## 10.3 Key architecture decisions

| Decision     | Recommendation                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------------- |
| JS vs native | Keep UI, session state, and alignment orchestration in TypeScript; keep audio capture and model inference native/JSI. |
| Expo         | Use Expo Development Build. Do not rely on Expo Go for recitation work.                                               |
| ASR          | Start with `whisper.rn` PoC; benchmark against ExecuTorch only after text-checking MVP.                               |
| Quran data   | Use stable word-level data from your Mushaf implementation or QUL/Quran Foundation.                                   |
| Haptics      | Use Expo Haptics for base feedback; add custom native haptics only if patterns need more control.                     |
| Tajweed      | Implement as separate engine with its own model/version/support matrix.                                               |

---

# 11. Data model

## 11.1 RecitationSession

```text
id
user_id_optional
scope_type
scope_start_token_id
scope_end_token_id
mode
started_at
ended_at
device_model_optional
asr_model_version
tajweed_model_version_optional
status
```

## 11.2 RecitationEvent

```text
id
session_id
timestamp_ms
event_type
token_id_optional
recognized_text_optional
expected_text_optional
confidence
audio_start_ms_optional
audio_end_ms_optional
metadata_json
```

Event types:

```text
word_correct
word_omitted
word_added
word_substituted
segment_repeated
jump_forward
jump_backward
pause_detected
alignment_uncertain
tajweed_passed
tajweed_possible_issue
tajweed_not_evaluated
```

## 11.3 TextEvaluationResult

```text
session_id
token_id
expected_text
recognized_text
status
error_type
alignment_confidence
audio_start_ms
audio_end_ms
```

## 11.4 TajweedEvaluationResult

```text
session_id
rule_instance_id
token_id
rule_type
status
confidence
expected_value
observed_value
audio_start_ms
audio_end_ms
explanation_key
```

---

# 12. UX requirements

## 12.1 Recitation screen

Required elements:

* selected scope indicator,
* start/pause/stop controls,
* microphone permission state,
* current ayah/word indicator,
* live word highlighting,
* subtle status indicator:

  * listening,
  * processing,
  * uncertain,
  * mistake detected,
  * paused,
* haptics toggle,
* emergency stop.

## 12.2 Display modes

| Mode              | Behavior                                               |
| ----------------- | ------------------------------------------------------ |
| Reading mode      | Full Mushaf visible; app follows recitation.           |
| Memorization mode | Text hidden or blurred; mistakes reveal relevant word. |
| Assisted mode     | Current ayah visible; future words hidden.             |
| Review mode       | User replays a previous session and mistakes.          |

## 12.3 Session report

Report should include:

* selected scope,
* completion status,
* text accuracy,
* list of textual mistakes,
* repeated mistake summary,
* optional audio replay,
* tajweed report if enabled,
* retry button for weak ayahs.

---

# 13. Accuracy and success metrics

## 13.1 Memorization checking metrics

| Metric                        | MVP target | Notes                                      |
| ----------------------------- | ---------: | ------------------------------------------ |
| Text mistake precision        |      ≥ 85% | Avoid false corrections.                   |
| Text mistake recall           |      ≥ 75% | Accept lower recall initially.             |
| False positive rate           |      ≤ 10% | Critical trust metric.                     |
| Alignment latency             |     ≤ 2.5s | From spoken word to stable decision.       |
| Haptic latency after decision |    ≤ 150ms | Not from speech start; from decision time. |
| Jump detection precision      |      ≥ 80% | Within selected scope.                     |
| Session crash rate            |  Near zero | Audio/model paths are high risk.           |

## 13.2 Tajweed metrics

| Metric                       |           Alpha target | Notes                                 |
| ---------------------------- | ---------------------: | ------------------------------------- |
| Rule-level precision         |                  ≥ 80% | Prefer fewer, reliable flags.         |
| Rule-level recall            |                  ≥ 50% | Alpha can miss issues.                |
| Not-evaluated rate           | Tracked, not penalized | Better than wrong correction.         |
| Madd duration classification |   ≥ 80% on curated set | Start with measurable rules.          |
| Ghunnah classification       |   ≥ 75% on curated set | Needs labeled examples.               |
| User dispute rate            |         Track manually | User marks “this was wrong feedback.” |

## 13.3 Product metrics

| Metric                                       |                                  Target |
| -------------------------------------------- | --------------------------------------: |
| Users completing first recitation session    | ≥ 60% of users who open recitation mode |
| Users disabling haptics after first use      |                                   ≤ 25% |
| Sessions with at least one useful correction |                                   Track |
| Repeat practice of flagged ayahs             |                                   Track |
| Day-7 retention for recitation users         |                                   Track |

---

# 14. Release plan

## Phase 0: Technical spike

Goal: prove React Native audio + on-device ASR + constrained alignment works on real devices.

Deliverables:

* Development Build configured.
* Microphone permission and PCM capture working.
* `whisper.rn` or selected ASR engine running on iOS and Android.
* Hardcoded Al-Fatiha or short ayah range.
* Basic normalized alignment.
* Latency and memory logs.

Exit criteria:

* Can recite a short known scope and get recognized tokens.
* App does not freeze during recording.
* Alignment can identify obvious skip/substitution errors.
* Memory usage is acceptable on at least one mid-range Android and one iPhone.

## Phase 1: Memorization checker MVP

Goal: productionize text-level recitation checking.

Scope:

* selected ayah/range/page,
* word-level matching,
* omission/addition/substitution/repetition/jump,
* live highlighting,
* optional haptic feedback,
* session report,
* local session storage.

Exit criteria:

* Text-checking benchmark reaches MVP precision/recall targets.
* False positives are low enough for beta users.
* Users can finish a full page session without crash or unacceptable latency.

## Phase 2: Tajweed alpha

Goal: introduce non-disruptive after-session tajweed feedback for a small rule set.

Scope:

* evaluate only confirmed aligned words,
* Madd duration alpha,
* Ghunnah alpha if dataset/model supports it,
* result states: passed, likely issue, not evaluated, low confidence,
* replay flagged segments,
* no live haptic tajweed correction.

Exit criteria:

* Rule-level precision acceptable on curated test recordings.
* Feedback language is conservative.
* Users understand that tajweed results are assistive, not certification.

## Phase 3: Tajweed beta

Goal: expand rule coverage and improve localization.

Scope:

* Qalqalah,
* selected noon sakinah/tanween rules,
* selected makhraj substitution patterns,
* personalized calibration,
* teacher review hooks.

---

# 15. Risks and mitigations

| Risk                                                        | Severity | Mitigation                                                                                     |
| ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| ASR false positives cause incorrect Quran correction        | High     | Use constrained matching, confidence thresholds, delayed hard correction, and uncertain state. |
| React Native audio/model pipeline causes performance issues | High     | Keep audio/inference native; use JSI/New Architecture; benchmark early on Android.             |
| Tajweed system overclaims correctness                       | High     | Start after-session only; use “possible issue”; exclude unsupported/low-confidence rules.      |
| On-device model too large or slow                           | Medium   | Use small model first; optional model downloads; device capability checks.                     |
| Haptics unavailable or disabled                             | Medium   | Always provide visual feedback fallback.                                                       |
| Quran data mismatch with Mushaf rendering                   | High     | Use stable word IDs and one canonical Quran data source across Mushaf and recitation.          |
| Background noise reduces accuracy                           | Medium   | Add audio quality detection and not-evaluated states.                                          |
| User privacy concerns                                       | Medium   | Default to local processing; make audio storage opt-in.                                        |

---

# 16. Acceptance criteria

## MVP acceptance criteria: Memorization checking

The MVP is acceptable when:

1. User can select an ayah range or page from the existing Mushaf.
2. User can start/stop a recitation session.
3. App listens without blocking the UI.
4. App follows the expected word sequence.
5. App detects at least:

   * skipped word,
   * substituted word,
   * added word,
   * repeated phrase,
   * jump forward.
6. App provides visual feedback and optional haptic feedback.
7. App produces a session report.
8. App stores session results locally.
9. App avoids hard correction when confidence is low.
10. App works on both iOS and Android via development/production native builds.

## Alpha acceptance criteria: Tajweed

The tajweed alpha is acceptable when:

1. It evaluates only words that were text-aligned.
2. It supports a declared limited rule set.
3. It can mark results as not evaluated.
4. It shows after-session feedback.
5. It allows replaying flagged audio.
6. It avoids claiming full tajweed correctness.
7. It reports rule-specific confidence.

---

# 17. Recommended immediate backlog

| Epic                      | Stories                                                                                                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Recitation infrastructure | Configure Expo Development Build; enable New Architecture; add mic permission flow; add audio capture spike.              |
| Quran word data           | Confirm current Mushaf word IDs; add normalized comparison field; add ayah/page scope loader.                             |
| ASR integration           | Add `whisper.rn`; load model; stream PCM chunks; return partial candidates.                                               |
| Alignment engine          | Implement normalization; sliding-window alignment; error classification; confidence policy.                               |
| Live feedback             | Add word highlighting; haptic feedback; uncertain state; haptic settings.                                                 |
| Session report            | Store events; render mistakes; jump to Mushaf location; retry scope.                                                      |
| Tajweed research spike    | Define supported rule set; generate rule instances from reference text; evaluate feasibility of Madd/Ghunnah classifiers. |

## Final recommendation

Build the recitation feature in this order:

1. **React Native native audio spike**
2. **On-device ASR PoC**
3. **Constrained memorization checker**
4. **Session report and progress tracking**
5. **Tajweed alpha as after-session rule evaluation**

This keeps the product useful early, avoids blocking on hard tajweed research, and gives you the data foundation needed to make tajweed evaluation credible later.

[1]: https://reactnative.dev/architecture/landing-page "About the New Architecture · React Native"
[2]: https://docs.expo.dev/develop/development-builds/introduction/?utm_source=chatgpt.com "Introduction to development builds"
[3]: https://docs.swmansion.com/react-native-audio-api/docs/inputs/audio-recorder/ "AudioRecorder | React Native Audio API"
[4]: https://github.com/mybigday/whisper.rn "GitHub - mybigday/whisper.rn: React Native binding of whisper.cpp. · GitHub"
[5]: https://docs.swmansion.com/react-native-executorch/docs/0.4.x/natural-language-processing/useSpeechToText "useSpeechToText | React Native ExecuTorch"
[6]: https://api-docs.quran.foundation/docs/api/field-reference/ "Field Reference | Quran Foundation Documentation Portal"
[7]: https://docs.expo.dev/versions/latest/sdk/haptics/ "Haptics - Expo Documentation"
[8]: https://aclanthology.org/2025.arabicnlp-sharedtasks.61/ "Iqra’Eval: A Shared Task on Qur’anic Pronunciation Assessment - ACL Anthology"
