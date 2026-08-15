# Al Furqan Development

Al Furqan is an Expo development-build app. It uses native modules, so use the installed development build rather than Expo Go.

For the complete first-time setup, account/sign-in requirements, simulator runtime installation and recovery, physical iPhone steps, Android steps, and Expo SDK upgrade record, read [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md).

## Non-negotiable launch rules

Before any launch, run `npm run dev:port`. Port 8081 must either be available or owned by this exact checkout. If another worktree owns it, coordinate a handoff and run `npm run dev:stop` from that owning worktree. Never accept Expo's suggestion to use port 8082.

Use only the project commands in this README. Do not use Expo Go, direct `npx expo start`, direct `xcodebuild` launch commands, or web rendering for native verification. The supported model is one active worktree/Metro server at a time; a separate Simulator isolates app binaries and data, but Metro port 8081 is still shared across the Mac.

## One-time setup

Install JavaScript dependencies:

```bash
npm install
```

For iOS, install Xcode and a simulator runtime matching the selected Xcode version under **Xcode > Settings > Components**. On Apple Silicon, the equivalent command is:

```bash
xcodebuild -downloadPlatform iOS -architectureVariant arm64
```

Confirm the setup when needed:

```bash
xcodebuild -version
xcrun simctl list runtimes
npx expo-doctor
```

## Recommended target: iOS Simulator

For the first run, or after installing a native package:

```bash
npm run ios
```

This generates the iOS project when needed, compiles the app with Xcode, installs it in the simulator, and starts Metro.

If Expo reports that it cannot find a matching destination, the matching iOS simulator runtime is missing from Xcode; install it using the one-time setup above.

For normal TypeScript, UI, style, and state changes after the app is installed:

```bash
npm start
```

Expo Fast Refresh updates the running app without another native build.

All native launch commands and Metro use port `8081`. Check its owner with `npm run dev:port`. Stop Metro with `npm run dev:stop`; for safety, that command refuses to terminate a listener owned by another checkout.

## Git worktrees

Worktrees have separate source/dependency/native folders but share Mac port 8081 and the Simulator service. On one Simulator device, the last worktree to install bundle ID `com.ahmeddaraz.alfurqan` replaces the earlier binary and reuses that device's app data.

Before changing worktrees:

```bash
# In the old worktree
npm run dev:stop

# In the new worktree
npm install
npm run dev:port
npm start              # press i to reuse a compatible installed native build
# or: npm run ios      # rebuild when native dependencies/config differ
```

Never accept Expo's fallback to port 8082. For isolated binaries and app data, create a separate Simulator device for each worktree. The complete reuse, rebuild, isolation, and cleanup procedure is in [docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md#13-developing-with-git-worktrees).

## Physical iPhone

Connect and unlock the iPhone, enable Developer Mode, and run:

```bash
npm run ios:device
```

Expo asks which connected device to use, builds and installs the development app, and starts Metro. If iOS reports an untrusted developer, trust the development certificate under **Settings > General > VPN & Device Management**.

The Mac and iPhone must be able to reach each other while Metro is running.

## Android

After installing Android Studio and starting an emulator or connecting an Android device, run:

```bash
npm run android
```

## When a native rebuild is required

Rebuild after any of these changes:

- Expo SDK upgrade
- Native dependency installation or removal
- `app.json` changes
- Permissions or Expo config-plugin changes

Use the command for the target:

```bash
npm run ios:rebuild
npm run ios:device:rebuild
npm run android:rebuild
```

To regenerate both native projects without launching either app:

```bash
npm run native:sync
```

The generated `ios/` and `android/` directories are intentionally ignored by Git. Expo config and config plugins are their source of truth.

## Web limitations

```bash
npm run web
```

Web is only a limited fallback. The SQLite-backed data flow and native Mushaf pager must be verified on iOS or Android.

## Other checks

```bash
npm run lint
npx tsc --noEmit
npm test
npx expo-doctor
```
