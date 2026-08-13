# Recitation Audio UAT Checklist

**Date:** 2026-04-27
**Branch:** `alfurqan-voice-recitation`
**Feature:** Recitation audio playback, mini-player, expanded controls, reciter switching, offline downloads, background controls
**Status:** Automated checks passed; native simulator UAT pending because this worktree does not include generated `ios/` native project files.

## Build Details

- App: Al Furqan / `alfurqan`
- Expo SDK: 55
- Audio library: `react-native-track-player`
- Filesystem: `expo-file-system/legacy`
- Verification commands completed:
  - `npm test -- --runInBand`
  - `npx tsc --noEmit`

## Device / Simulator

- Native UAT target: iOS simulator via `npx expo run:ios`
- Current workspace note: no generated native `ios/` folder is present, so simulator checks were not executed in this pass.

## Frame Parity Checks 01-08

- 01 Idle: bottom toolbar present with separate green mic and playback button.
- 02 Ayah popup open: popup `تشغيل` remains the audio entry point.
- 03 Loading audio: mini-player appears above toolbar and shows loading copy.
- 04 Playing: mini-player shows pause, stop, reciter, current ayah, and progress line.
- 05 Paused: mini-player stays visible and can resume.
- 06 Auto-advanced: engine advances ayah and reinjects playing highlight.
- 07 Page flipped: active WebView registration resends or clears highlight without stopping audio.
- 08 Expanded controls: sheet includes reciter, ayah text, seek, transport, speed, download, repeat, and reciter picker.

## Audio Playback Checks

- Popup play starts from selected ayah and continues to the end of that surah.
- Toolbar play starts from the top ayah on the visible Mushaf page.
- Toolbar play is a no-op while playing and resumes when paused.
- Next/previous honor ayah boundaries.
- Surah loop mode wraps from the stop ayah to ayah 1.
- Seek during loading is applied after load completion.
- Pause during loading lands in paused state without autoplay.

## Offline / Download Checks

- Cached ayah returns local file without download.
- Missing ayah downloads to a unique temp path and moves to persistent storage.
- Empty cached file is deleted and refetched.
- Parallel requests for the same ayah share one in-flight promise.
- Surah download state tracks idle, downloading, complete, error, cancel, and delete.
- Settings displays saved recitation size and exposes a delete action.

## Background Audio Checks

- iOS config includes `UIBackgroundModes: ["audio"]`.
- Android config includes foreground service playback permissions.
- Remote controls are registered for play, pause, stop, seek, next, and previous.
- Native UAT still needed to confirm Control Center metadata and hardware/lock-screen behavior.

## Known Limitations From V1 Non-Goals

- No live microphone recitation or ASR.
- No auto-page-flip while audio plays.
- No cross-surah playback.
- No word-level audio highlight.
- No per-ayah memorization repeat counts.
- No cache eviction/storage cap policy beyond user-managed deletion.
- No CarPlay or Android Auto scope.
