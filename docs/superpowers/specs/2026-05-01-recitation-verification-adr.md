# Recitation Verification ADR

**Date:** 2026-05-01
**Status:** Accepted for spike
**Decision Owner:** Ahmed / Codex

## Context

The technical research recommends a Flutter + Whisper + SQLite stack for Tasmi'. This repository is already an Expo/React Native application with:

- Expo SDK 55 and React Native 0.83
- native dev-client workflows for simulator and physical iOS builds
- bundled SQLite Quran data
- MMKV/Zustand persistence
- RTL-first UI conventions
- `expo-haptics`
- a practice modal that currently renders demo verification states
- existing recitation audio playback services

The hard technical risk is not the UI framework. The hard risk is whether Quranic Arabic ASR can produce accurate, low-latency enough transcript chunks for useful live correction.

## Decision

Build the memorization verification epic in the current Expo/React Native app first. Do not migrate to Flutter unless the ASR spike demonstrates a React Native blocker that cannot be reasonably solved.

The verification architecture will use small boundaries:

1. `AsrAdapter`: native or mock transcript chunk source.
2. `quranTextNormalizer`: deterministic Arabic/Uthmani normalization.
3. `tasmeeaMatcher`: sliding-window edit-distance alignment and baseline error classification.
4. Practice UI/session state: consumes match results and triggers haptics.

## ASR Candidates

| Candidate | Strength | Main Risk | Spike Question |
|---|---|---|---|
| `whisper.rn` | Direct whisper.cpp binding, realtime transcriber, VAD/audio-stream adapter support | native setup and model asset handling in Expo dev-client | Can it stream Arabic/multilingual Whisper chunks in this app with acceptable memory and latency? |
| `react-native-executorch` | Expo/RN-focused on-device ML API, STT hook, word timestamp support, 16kHz waveform path | current built-in examples skew toward file/chunk workflows; native compatibility must be checked | Can it provide live-enough Arabic transcription without a fragile audio bridge? |
| Cloud WebSocket ASR | fastest to validate concept, easier server-side updates | privacy/offline differentiator lost; ongoing cost | Useful only as fallback or benchmark, not MVP default |

## Consequences

- Existing UI, Quran rendering, SQLite, haptics, and persistence work remain valuable.
- We avoid a framework migration before measuring the real ASR bottleneck.
- Native dependency work is isolated behind an adapter so the first ASR candidate can be replaced.
- The first shippable spike can run with mocked transcripts before the microphone path is stable.

## Gates

- A native ASR adapter runs in the Expo dev-client on iOS.
- Al-Fatiha live or simulated transcript chunks can drive word highlighting and haptics.
- Base-word comparison handles repeats, skipped words, pauses, and self-correction.
- p95 audio-to-haptic latency is under 2 seconds on a real iPhone.
- False positive rate is below 10% on a small reviewed dataset before expanding beyond common surahs.

## Non-Goals For First Spike

- Tajweed-specific error detection
- Diacritic/harakat correctness
- personalized voice model training
- cloud sync
- monetization
- full Juz Amma coverage

## Immediate Implementation Order

1. Add deterministic normalization tests and implementation.
2. Add Tasmeea-style matching tests and implementation.
3. Add `quran_words` data source design and an Al-Fatiha fixture if the full DB source is not ready.
4. Add mock ASR adapter to drive the practice screen.
5. Install one native ASR candidate only after compatibility review.
