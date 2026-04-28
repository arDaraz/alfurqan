# Al Furqan Development Notes

## The Important Rule

This app uses native modules such as `expo-audio`, so the physical iPhone must run the installed `Al Furqan` development build.

Do not use Expo Go for this project.
Do not scan the QR with the iPhone Camera or Code Scanner.
Do not press `s` in Metro, because that switches Metro to Expo Go mode.

Open `Al Furqan` from the iPhone Home Screen after it is installed.

## After Codex Changes

Use this checklist after every code change.

### JS-only changes

Use this for UI, copy, styles, stores, and TypeScript changes that do not add native modules:

```bash
npm run dev
```

Then reload the app from the simulator or phone dev menu.

### Native changes

Use this when `package.json`, `app.json`, `ios/`, native modules, permissions, or CocoaPods changed. Also use it for errors like `Cannot find native module 'ExpoAudio'`.

Physical iPhone:

```bash
npm run phone:native
```

Simulator:

```bash
npm run sim:native
```

`phone:native` now builds for the paired physical iPhone directly. It does not use Expo's device picker, which can accidentally select the simulator.

## First Physical iPhone Install

If iOS shows `Untrusted Developer`, the app was installed successfully but iOS is blocking the first launch.

On the iPhone:

1. Open `Settings`.
2. Go to `General`.
3. Open `VPN & Device Management`.
4. Tap `Apple Development: ahmed.daraz@outlook.com (47NBYZ3BH6)`.
5. Tap `Trust`.
6. Open `Al Furqan` from the Home Screen.

Then keep Metro running from this repo:

```bash
npm run dev
```

## Port 8081 Problems

If Expo says:

```text
Port 8081 is running this app in another window
```

Do not accept port `8082`. Stop the old Metro process and restart on `8081`:

```bash
npm run dev:stop
npm run dev
```

One-command version:

```bash
npm run dev:restart
```

`dev:stop` stops Metro on both `8081` and `8082`, because accidentally starting a second server on `8082` can make the app connect to the wrong bundle.

## Expo Go Screen

If the phone shows `Project is incompatible with this version of Expo Go`, you opened Expo Go instead of the development build.

Close Expo Go and open `Al Furqan` from the Home Screen. If `Al Furqan` is not installed, run:

```bash
npm run phone:native
```

## Useful NPM Tasks

```bash
npm run dev            # Start Metro for the development build on LAN, port 8081
npm run dev:port       # Show what is listening on port 8081
npm run dev:stop       # Stop Metro on ports 8081 and 8082
npm run dev:restart    # Stop Metro, then start it again on 8081
npm run native:clean   # Remove Al Furqan native build output and DerivedData
npm run phone:build    # Build the app for the paired physical iPhone
npm run phone:install  # Install the last physical iPhone build
npm run phone:launch   # Launch the app on the paired physical iPhone
npm run phone:rebuild  # Clean, build, install, and launch on physical iPhone
npm run phone:native   # Full physical iPhone repair path, then start Metro
npm run sim:native     # Rebuild the simulator app, then start Metro
npm test               # Run Jest tests
```

## Why Audio Needed A Rebuild

Metro can reload JavaScript into an installed app, but it cannot add native modules to an existing iPhone binary.

`expo-audio` adds the native `ExpoAudio` module. If the phone has an older binary, JavaScript can import the new code but iOS cannot find the native module. `npm run phone:native` rebuilds and reinstalls the phone binary so `ExpoAudio` exists on the device.
