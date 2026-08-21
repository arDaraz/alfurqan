# Development setup and launch guide

This is the complete development workflow for Al Furqan after the Expo SDK 57 upgrade. The app is an Expo development build with native modules. It does not run correctly in Expo Go, and web is not a valid substitute for native verification.

## 1. Accounts, credentials, and security

### Simulator-only development

An Apple Developer Program membership is not required to run the iOS Simulator. You need:

- a macOS user account that can install Xcode components;
- the Mac login password or Touch ID when macOS asks for administrator approval;
- no Apple ID password in this repository.

### Physical iPhone development

You also need:

- an Apple ID added in **Xcode > Settings > Accounts**;
- a development team selected by Xcode; local device signing may use a Personal Team when the app's capabilities and account status permit it, while distribution and some capabilities require Apple Developer Program membership;
- the iPhone unlocked, paired with the Mac, trusted, and in Developer Mode;
- the Apple ID password, passkey, Touch ID, 2FA code, certificates, and signing keys kept only in Apple/Xcode/macOS credential stores.

Never put passwords, passkeys, 2FA codes, private signing keys, or tokens in `.env`, README files, shell history, issues, or Git. Instructions use placeholders such as `<your-apple-id>`; substitute them only in Apple's protected UI.

Useful official pages:

- [Apple Developer account](https://developer.apple.com/account/)
- [Apple Developer downloads](https://developer.apple.com/download/all/)
- [Xcode on the Mac App Store](https://apps.apple.com/app/xcode/id497799835)
- [Expo documentation](https://docs.expo.dev/)
- [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Node.js downloads](https://nodejs.org/en/download)
- [Android Studio](https://developer.android.com/studio)

### What to expect from Touch ID

Apple sign-in can open a protected macOS authentication sheet instead of a normal Safari window. After successful Touch ID or password authentication, that sheet closes immediately. This is normal; return to Safari and confirm that the Apple Developer page shows your account name and a **Sign Out** link. If Touch ID times out, choose the Mac-password option and enter it yourself in the protected system prompt.

Apple's direct-download page may still say that the account cannot access an archive if the Developer Program Account Holder has not accepted the latest agreement. That does not prevent normal Simulator development through Xcode's Components installer.

## 2. Install the tools

Two tiers. The required tier is enough for the normal workflow: one checkout, one Simulator, Metro on port 8081. The optional tier exists only for running several worktrees at once; skip it on a first setup and come back when you need it.

### Required

| Tool | Install | Verify |
| --- | --- | --- |
| Node.js LTS | official Node.js page, or `brew install node` | `node --version` |
| Xcode | Mac App Store | `xcodebuild -version` |
| iOS Simulator runtime | section 4 below | `xcrun simctl list runtimes` |
| CocoaPods | `brew install cocoapods` | `pod --version` |

1. Install the current LTS version of Node.js from the official Node.js page.
2. Install Xcode from the Mac App Store.
3. Open Xcode once so it can install its command-line components and display any license prompt.
4. Select the installed Xcode:

   ```bash
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

   This command may request the Mac administrator password. Do not store that password anywhere.

5. Confirm the selected toolchain:

   ```bash
   xcodebuild -version
   xcode-select -p
   xcodebuild -showsdks
   ```

6. Install CocoaPods with `brew install cocoapods` if `pod --version` is unavailable. Expo prebuild invokes CocoaPods for iOS native dependencies. Avoid `sudo gem install`; the system Ruby regularly fails to build native gems.
7. For Android, install Android Studio, its SDK/platform tools, and an emulator from the official Android Studio page.

### Optional: multi-worktree tools

A single checkout needs none of these. The launch wrapper detects the primary checkout and uses port 8081 with no extra tools installed.

| Tool | Needed for | Without it |
| --- | --- | --- |
| worktrunk (`wt`) | Per-worktree Metro ports, Simulator devices, and branch naming | A **linked worktree** cannot resolve its port: `npm run dev:port` exits 2. Set `ALFURQAN_METRO_PORT` yourself, or work in the primary checkout only. |
| GitHub CLI (`gh`) | `wt new <issue>` reads the issue title for the branch slug | Pass the slug words yourself: `wt new 12 fix ports` |
| watchman | File watching when several Metro servers run at once | Metro falls back to its own crawler, which can exhaust file descriptors with multiple servers |

Install with `brew install worktrunk gh watchman` (adjust to what you actually need).

**Worktrunk alone is not enough.** The `wt new` and `wt metro-port` commands this repo's docs reference are aliases and hooks from a worktrunk *user config*, not part of worktrunk itself or of this repo. On a machine without that config, `wt metro-port` fails and the launch wrapper falls back to the error above; `ALFURQAN_METRO_PORT` is always the escape hatch. The config must define:

- `aliases.metro-port` printing `{{ (repo ~ '-' ~ branch) | hash_port }}`,
- optionally `post-start` hooks that run `npm install` and create a per-worktree Simulator device, and `pre-remove` hooks that delete that device and the worktree's DerivedData.

See section 13 for what those hooks do and why.

## 3. Clone and install Al Furqan

From the repository root:

```bash
npm install
npx expo-doctor --verbose
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

Expected Expo versions after this upgrade include Expo SDK 57, React Native 0.86, React 19.2, and TypeScript 6. The lockfile is authoritative; do not run `npm audit fix --force`, because npm can propose incompatible Expo/React Native downgrades.

## 4. Install the matching iOS Simulator runtime

The Xcode application, the iOS SDK used to compile, and the Simulator runtime are separate pieces. Xcode can be installed while the runtime needed to launch an iPhone Simulator is missing.

### Recommended graphical method

1. Open Xcode.
2. Select **Xcode > Settings > Components**.
3. Find the iOS runtime that matches the installed Xcode/SDK.
4. Click **Get** and wait for download, verification, and installation to finish.
5. Confirm it from Terminal:

   ```bash
   xcrun simctl list runtimes
   xcrun simctl runtime list -v
   ```

### Recommended command-line method

On Apple Silicon:

```bash
xcodebuild -downloadPlatform iOS -architectureVariant arm64
```

To request a known build explicitly:

```bash
xcodebuild -downloadPlatform iOS \
  -buildVersion <runtime-build-number> \
  -architectureVariant arm64
```

For the Xcode 26.6 setup repaired on 15 August 2026, the matching runtime was iOS 26.5 build `23F77`.

### Verify destinations

After installation and native generation:

```bash
npm run native:sync
xcodebuild \
  -workspace ios/AlFurqan.xcworkspace \
  -scheme AlFurqan \
  -showdestinations
```

The output must contain eligible `iOS Simulator` devices, not only an `Any iOS Simulator Device` placeholder.

## 5. Run in the iOS Simulator

### Mandatory preflight for people and coding agents

Run these commands from the worktree you intend to test:

```bash
pwd
git status -sb
npm run dev:port
```

`npm run dev:port` prints this worktree's own Metro port. Continue only when that port is available or the reported process directory exactly matches the current `pwd` output. Each worktree has its own port, so another checkout holding this port is rare and means a hash collision or a stale server. In that case:

1. do not kill all Node/Expo processes by name;
2. run `npm run dev:stop` from the reported owning worktree, or set `ALFURQAN_METRO_PORT` to move this worktree elsewhere;
3. return here and run `npm run dev:port` again.

Then use this decision table:

| Situation | Command | What it does |
| --- | --- | --- |
| First run in this checkout, native app absent, or native inputs changed | `npm run ios` | Builds, installs, launches, and starts/reuses the correct Metro server. |
| Compatible native development build already installed; only JS/TS/UI changed | `npm start`, then press `i` | Reuses the native shell and loads this worktree's bundle. |
| Physical iPhone | `npm run ios:device` | Selects, signs, builds, and launches on the connected device. |
| Android emulator/device | `npm run android` | Builds, installs, launches, and starts/reuses Metro. |
| Unsure what owns Metro | `npm run dev:port` | Prints the listener PID, command, and working directory. |
| Finished with this worktree | `npm run dev:stop` | Stops Metro only if this checkout owns it. |

Do not use Expo Go, direct `npx expo start`, direct `xcodebuild` launch commands, or web rendering as an alternative path. These bypass the repository's ownership checks or do not support the native SQLite/pager behavior.

For the first run:

```bash
npm run ios
```

This is the canonical simulator command. It:

1. runs `expo run:ios`;
2. generates the ignored `ios/` project when it is absent;
3. installs CocoaPods when required;
4. compiles the native development app with Xcode;
5. installs and launches it in the selected Simulator;
6. starts Metro for the JavaScript bundle.

The first clean build can take several minutes. After the development build is installed, ordinary TypeScript, UI, style, string, and state changes only need:

```bash
npm start
```

Keep the installed Al Furqan app open. Fast Refresh sends JavaScript changes without rebuilding Xcode.

The wrapper picks the port: `8081` in the primary checkout, and in a linked worktree the port worktrunk derives from repo plus branch (range 10000-19999). It never falls forward to another port on its own, because that can connect the native app to the wrong worktree's JavaScript bundle. Inspect the listener with:

```bash
npm run dev:port
```

Stop it safely with:

```bash
npm run dev:stop
```

The stop command only terminates Metro when its process working directory is this checkout. If another checkout owns the port, it prints that process's PID, command, and directory and refuses to kill it. Change to the owning project directory and stop it there before retrying.

To force a clean native regeneration and build:

```bash
npm run ios:rebuild
```

Use that after an Expo SDK upgrade, native package change, `app.json` change, permission change, or config-plugin change.

## 6. Run on a physical iPhone

1. Connect the iPhone by USB for the first setup.
2. Unlock it and accept **Trust This Computer** on both devices if prompted.
3. Enable **Settings > Privacy & Security > Developer Mode** on the iPhone, then follow the restart confirmation.
4. In Xcode, add the Apple ID under **Xcode > Settings > Accounts** if it is not already present.
5. Run:

   ```bash
   npm run ios:device
   ```

6. Select the connected iPhone when Expo asks.
7. If iOS reports an untrusted developer, open **Settings > General > VPN & Device Management**, select the Apple Development identity, and trust it.
8. Keep Metro running and keep the Mac and iPhone on a network where they can reach each other.

After a native dependency/config change, use:

```bash
npm run ios:device:rebuild
```

Do not use the removed direct `xcodebuild` phone script. Expo CLI now owns simulator and physical-device selection consistently.

## 7. Run on Android

1. Install Android Studio from the official link above.
2. Use Android Studio's SDK Manager to install the current Android SDK and platform tools.
3. Start an emulator in Device Manager, or connect an Android device with USB debugging enabled.
4. Run:

   ```bash
   npm run android
   ```

5. After a native/config change, run:

   ```bash
   npm run android:rebuild
   ```

## 8. Regenerate native projects without launching

The generated `ios/` and `android/` folders are ignored by Git. `app.json`, package dependencies, and Expo config plugins are the source of truth.

Regenerate both projects:

```bash
npm run native:sync
```

This runs `expo prebuild --clean`, so do not place hand-written source exclusively inside `ios/` or `android/`.

## 9. Web is only a limited fallback

```bash
npm run web
```

Do not use web for final verification. `expo-sqlite` data flows, `react-native-pager-view`, RTL font/layout behavior, and native shadows differ or do not work there.

## 10. Verify the running iOS app

After the app launches:

```bash
xcrun simctl list devices | grep Booted
# Name the device. `booted` is ambiguous once a second Simulator runs.
xcrun simctl io "alfurqan $(basename $PWD)" screenshot /tmp/alfurqan-screen.png   # worktree device
xcrun simctl io "iPhone 17 Pro" screenshot /tmp/alfurqan-screen.png              # or the shared device
```

Inspect the screenshot and confirm that Metro contains no red-screen or missing-native-module error. Then run the quality checks:

```bash
npx expo-doctor --verbose
npx tsc --noEmit
npm run lint -- --quiet
npm test -- --runInBand
git diff --check
```

## 11. Recovery used when Xcode 26.6 was stuck on “Preparing”

This is a version-specific recovery record, not the normal install path. Prefer Xcode Components or `xcodebuild -downloadPlatform` first.

The built-in downloader fetched Apple's catalog but froze before opening a network connection. The catalog was:

```text
/System/Library/AssetsV2/com_apple_MobileAsset_iOSSimulatorRuntime/com_apple_MobileAsset_iOSSimulatorRuntime.xml
```

It identified the Apple Silicon iOS 26.5 build `23F77` asset, including its public CDN URL, SHA-256, and archive decryption metadata. The public asset used was:

```text
https://updates.cdn-apple.com/2026MobileAssets/mobileassets/141-17392/0A720BB6-B0DE-46BC-8324-90F7E631AD5B/com_apple_MobileAsset_iOSSimulatorRuntime/A108B06B-0C8C-47DD-85CB-8A727740A501.aar
```

Expected SHA-256:

```text
a0872c9d79380c56f1b3a6397bd15a59d8a50534ac67727d979e56a94e8f840b
```

Before using the public MobileAsset CDN, Safari was signed into the Apple Developer downloads page and this legacy-style archive URL was tested:

```text
https://download.developer.apple.com/Developer_Tools/iOS_26.5_Simulator_Runtime/iOS_26.5_Simulator_Runtime.dmg
```

Apple redirected that request to an **Unauthorized** page for this account and explained that Developer Program agreement/access requirements might apply. No password or 2FA value was copied out of Apple's protected sign-in flow. The public `updates.cdn-apple.com` MobileAsset URL from Xcode's local Apple catalog was therefore used instead.

The stalled state was diagnosed before changing the install path:

```bash
df -h / "$HOME/Downloads"
pgrep -alf 'xcodebuild.*downloadPlatform'
xcrun simctl list runtimes

# For a specifically identified stuck PID only:
sample <stuck-xcodebuild-pid> 2 1 -file /tmp/xcodebuild-download.sample
lsof -nP -p <stuck-xcodebuild-pid>
```

The sample showed `DVTDownloadableOperationDownload` waiting inside `_attemptMobileAssetDownload` with no active network connection. Only the specifically identified stale download processes were terminated; unrelated Xcode, Simulator, and CoreSimulator processes were left alone.

The successful recovery sequence was:

```bash
# 1. Read and verify the version-specific metadata before downloading.
plutil -p \
  /System/Library/AssetsV2/com_apple_MobileAsset_iOSSimulatorRuntime/com_apple_MobileAsset_iOSSimulatorRuntime.xml

# 2. Download the exact public Apple asset. aria2 was used for resumable,
# parallel ranges; curl --continue-at - is also valid.
aria2c --continue=true \
  --max-connection-per-server=16 \
  --split=16 \
  --min-split-size=20M \
  --file-allocation=none \
  --dir="$HOME/Downloads" \
  --out=iOS_26.5_Simulator_Runtime_23F77.aar \
  'https://updates.cdn-apple.com/2026MobileAssets/mobileassets/141-17392/0A720BB6-B0DE-46BC-8324-90F7E631AD5B/com_apple_MobileAsset_iOSSimulatorRuntime/A108B06B-0C8C-47DD-85CB-8A727740A501.aar'

# 3. Verify the downloaded bytes against Apple's catalog.
shasum -a 256 "$HOME/Downloads/iOS_26.5_Simulator_Runtime_23F77.aar"

# 4. Decrypt the AEA container using the ArchiveDecryptionKey published in
# that same local Apple catalog. Obtain the current key from the catalog;
# do not copy an old version's key.
aea decrypt \
  -i "$HOME/Downloads/iOS_26.5_Simulator_Runtime_23F77.aar" \
  -o "$HOME/Downloads/iOS_26.5_Simulator_Runtime_23F77.aa" \
  -key-value 'base64:<ArchiveDecryptionKey-from-the-catalog>' \
  -v

# 5. Materialize the MobileAsset with Apple's yaa asset patcher.
mkdir -p \
  "$HOME/Downloads/iOS_26.5-runtime-source" \
  "$HOME/Downloads/iOS_26.5-runtime-patched"
yaa patch \
  -i "$HOME/Downloads/iOS_26.5_Simulator_Runtime_23F77.aa" \
  -src "$HOME/Downloads/iOS_26.5-runtime-source" \
  -dst "$HOME/Downloads/iOS_26.5-runtime-patched" \
  -v

# 6. Validate the resulting disk image before import.
find "$HOME/Downloads/iOS_26.5-runtime-patched" -name '*.dmg' -print
hdiutil imageinfo \
  "$HOME/Downloads/iOS_26.5-runtime-patched/AssetData/Restore/094-56039-099.dmg"

# 7. Let Xcode/CoreSimulator verify, register, and mount it.
xcodebuild -importPlatform \
  "$HOME/Downloads/iOS_26.5-runtime-patched/AssetData/Restore/094-56039-099.dmg"

# 8. Confirm the runtime is Ready and Signature State is Verified.
xcrun simctl list runtimes
xcrun simctl runtime list -v
```

The CDN URL, build number, restore-image filename, digest, and catalog key all change by Xcode/runtime release. Never reuse this exact recovery block for another version without first reading Apple's current local catalog and validating every value. `ArchiveDecryptionKey` in that catalog is package metadata, not an Apple ID password or signing credential.

## 12. Expo SDK upgrade procedure used

The SDK 55 project was migrated to the latest stable Expo SDK 57 with this sequence:

```bash
# Check the registry's current stable release.
npm view expo version dist-tags --json

# Install the stable Expo SDK and let Expo align managed packages.
npm install expo@latest
npx expo install --fix

# Install required direct dependencies/peers reported by Expo Doctor.
npx expo install expo-asset @expo/vector-icons

# Regenerate ignored native projects and CocoaPods from config.
npm run native:sync

# Diagnose and verify.
npx expo-doctor --verbose
npx tsc --noEmit
npm run lint -- --quiet
npm test -- --runInBand
```

The migration also removed the direct `expo-modules-core` dependency, because Expo owns it transitively; aligned React Native/React/Expo packages; updated test transforms and TypeScript/Jest types; and replaced the old separate physical-iPhone shell workflow with the unified npm commands above.

## 13. Developing with Git worktrees

Git worktrees are useful for keeping multiple branches checked out at the same time. Each worktree has its own source files, `node_modules`, generated `ios/` and `android/` folders, and Xcode build directory identity. They still share several machine-wide resources, which is where launch confusion comes from.

### Create a worktree

Prerequisite: the optional multi-worktree tools from section 2, including the worktrunk user config they describe. With them installed, one command does everything:

```bash
wt new 12               # branch 12-<slug from the GitHub issue title>
wt new 12 fix ports     # branch 12-fix-ports, no gh lookup needed
```

`wt new` creates the branch and worktree, runs `npm install`, creates a Simulator device named `alfurqan <branch>`, and gives the worktree its own Metro port. `wt remove <branch>` undoes all of that, including the device and the worktree's Xcode build directory.

Branch names are `<github-issue-number>-<slug>`, all lowercase, hyphens only. **Never use a slash in a branch name.** The worktree directory is named after the branch, and the two must be identical; a slash would be rewritten to a hyphen in the directory name and the names would stop matching. A guard refuses such branches at creation.

Without the worktrunk tooling, plain Git still works, but nothing is automated:

```bash
git fetch --all --prune
git worktree add ../worktrees/alfurqan/12-fix-ports -b 12-fix-ports
cd ../worktrees/alfurqan/12-fix-ports
npm install
ALFURQAN_METRO_PORT=10123 npm start   # pick any free port; the wrapper cannot derive one without wt
```

Create a separate Simulator device by hand (see “Use a separate Simulator device per worktree” below), and remember that removing such a worktree with `git worktree remove` cleans up neither the device nor DerivedData. Never point two worktrees at the same branch; Git normally prevents this.

### What worktrees share

| Resource | Shared or isolated? | Practical effect |
| --- | --- | --- |
| Git objects and repository history | Shared | Fetches and commits are visible to all worktrees. Uncommitted files are not. |
| Working files and `node_modules` | Isolated by directory | Run `npm install` in every worktree. A dependency change in one does not update another's installation. |
| Generated `ios/` and `android/` | Isolated by directory | Run native regeneration in the worktree whose config changed. Do not copy generated native folders between worktrees. |
| Metro port | Isolated per worktree | The primary checkout uses 8081; each linked worktree gets a stable port derived by worktrunk from repo plus branch. Several Metro servers can run at once. |
| iOS Simulator runtimes/devices | Shared across the Mac | All worktrees can boot the installed iOS 26.5 runtime and existing simulator devices. |
| Installed app on one Simulator device | Shared by bundle ID | The last worktree that installs `com.ahmeddaraz.alfurqan` replaces the earlier worktree's app binary on that same Simulator device. |
| App data on one Simulator device | Shared by bundle ID/container | State, MMKV preferences, and SQLite data can carry across worktree handoffs on that device. |
| Xcode DerivedData | Machine-wide, but normally path-hashed | Builds usually remain separate, but do not assume one worktree's native output proves another worktree builds. |

### How each worktree gets its Metro port

Metro listens on a TCP port, not “inside” a worktree. The danger with a shared port is that an installed development client keeps requesting one worktree's URL while the developer is looking at another, producing stale screens, the wrong branch, or apparently missing changes.

This repository avoids that by giving every worktree its own stable port:

- the primary checkout always uses 8081;
- a linked worktree asks worktrunk for its port, derived from repo plus branch, so the same branch always gets the same port;
- `scripts/expo-run.mjs` inspects the listener's process working directory and reuses Metro only when the listener belongs to the current worktree;
- it refuses to launch when a different checkout owns the port, and `ALFURQAN_METRO_PORT` moves this worktree if that ever happens;
- `npm run dev:stop` refuses to kill a different worktree's process.

Inspect the owner from any worktree:

```bash
npm run dev:port
```

The output includes this worktree's port plus the listener's PID, command, and working directory.

### Safe handoff from worktree A to worktree B

Each worktree has its own Metro port, so worktree B can start without stopping A. The handoff below is needed only when the two worktrees share one Simulator device or one installed native build. A new task must not assume that the currently running Simulator app or Metro process belongs to its worktree.

In worktree A:

```bash
cd /path/to/worktree-a
npm run dev:stop
```

If its branch predates the safe stop script, press `Ctrl+C` in the terminal that is running Metro. Use `npm run dev:port` from the updated checkout to identify the old PID/path, then stop it from the owning worktree. Do not kill an unrelated Node process by name.

Then in worktree B:

```bash
cd /path/to/worktree-b
npm install
npm run dev:port   # must report this worktree's own port as available
```

Choose one of the following paths.

#### Reuse the installed native development build

Reuse is safe when both worktrees have compatible native inputs: the same Expo SDK, React Native version, native dependencies, config plugins, permissions, and relevant `app.json` native configuration.

```bash
npm start
```

When Metro is ready, press `i` in that terminal to open the current worktree's URL in the booted Simulator. The installed development client is a native shell and can load worktree B's JavaScript without an Xcode rebuild when its native modules are compatible.

#### Rebuild and replace the installed app

Rebuild when `package.json`, the Expo SDK, a native dependency, a config plugin, permissions, or native `app.json` settings differ:

```bash
npm run ios
```

This installs worktree B's binary over worktree A's binary on the currently selected Simulator device because both use the same bundle identifier. Returning to worktree A may then require another `npm run ios` if A expects a different native binary.

### Simulator reuse versus isolation

Use this rule: a worktree owns source files, but the Mac owns Simulator devices and TCP ports. The same Simulator device does not preserve two different builds with the same bundle identifier.

#### Reuse one Simulator device

Use one shared Simulator when only one worktree is active at a time and app data can be shared. Stop the previous Metro server, switch directories, start the new worktree's Metro, and rebuild only if native inputs differ.

#### Use a separate Simulator device per worktree

Use separate devices when worktrees need isolated app binaries/data or different database/onboarding states. List available device types and runtimes:

```bash
xcrun simctl list devicetypes
xcrun simctl list runtimes
```

Create and boot a named device for a worktree (use identifiers reported by those commands):

```bash
xcrun simctl create \
  'Al Furqan - feature-name' \
  'com.apple.CoreSimulator.SimDeviceType.iPhone-17-Pro' \
  'com.apple.CoreSimulator.SimRuntime.iOS-26-5'

xcrun simctl list devices
xcrun simctl boot '<new-device-udid>'
open -a Simulator --args -CurrentDeviceUDID '<new-device-udid>'
npm run ios
```

Separate Simulator devices isolate the installed app and its MMKV/SQLite data. Combined with per-worktree Metro ports, they are what make two worktrees fully independent. `wt new` creates the device automatically; the commands above are the manual fallback.

### Running two worktrees simultaneously

Supported. Each worktree runs Metro on its own derived port and installs the app on its own Simulator device. Start each one from its own directory with `npm start`, and connect each device to its own worktree with the development client's server list, or with a deep link naming the port explicitly:

```bash
xcrun simctl openurl <device-udid> "alfurqan://expo-development-client/?url=http%3A%2F%2Flocalhost%3A<port>"
```

Take screenshots from a specific device by name, never `booted`, which is ambiguous once a second Simulator runs:

```bash
xcrun simctl io "alfurqan <branch>" screenshot /tmp/alfurqan-screen.png
```

### Before removing a worktree

Check for uncommitted work first:

```bash
git -C /path/to/worktree status --short
git worktree list
```

Stop its Metro server from inside that worktree. Remove the worktree only after its changes are committed, preserved elsewhere, or intentionally discarded. Prefer `wt remove <branch>`: it also deletes the worktree's Simulator device and its Xcode build directory. Plain Git works but runs no cleanup hooks, so the device and DerivedData leak:

```bash
git worktree remove /path/to/worktree
git worktree prune
```

Do not use `--force` on a worktree with changes you need.
