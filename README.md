# Al Furqan Development

Al Furqan is an Expo development-build app. It uses native modules, so use the installed development build rather than Expo Go.

**[docs/DEVELOPMENT_SETUP.md](docs/DEVELOPMENT_SETUP.md) is the single source of truth for the development workflow**: tools and first-time setup, accounts and signing, simulator runtimes and recovery, ports, worktrees, physical iPhone, Android, and rebuild rules. This README is the quick start; when the two disagree, the setup doc wins.

## Quick start

```bash
npm install
npm run ios        # first run: builds, installs on the iOS Simulator, starts Metro
npm start          # later JS-only changes: Fast Refresh, no Xcode rebuild
```

If the build cannot find a simulator destination, install the matching iOS runtime: [setup doc, section 4](docs/DEVELOPMENT_SETUP.md#4-install-the-matching-ios-simulator-runtime).

## Non-negotiable launch rules

- Run `npm run dev:port` before any launch. It prints this worktree's Metro port and its owner.
- Use only the npm commands from `package.json`. No Expo Go, no direct `npx expo start`, no direct `xcodebuild`, no web rendering for native verification.
- Stop Metro with `npm run dev:stop`, never by killing Node processes by name.

How ports are derived, what `ALFURQAN_METRO_PORT` overrides, and how several worktrees run at once: [setup doc, sections 5 and 13](docs/DEVELOPMENT_SETUP.md#5-run-in-the-ios-simulator).

## Common tasks

| Task | Command | Detail |
| --- | --- | --- |
| Create a worktree | `wt new <github-issue-number>` | [section 13](docs/DEVELOPMENT_SETUP.md#13-developing-with-git-worktrees) |
| Physical iPhone | `npm run ios:device` | [section 6](docs/DEVELOPMENT_SETUP.md#6-run-on-a-physical-iphone) |
| Android | `npm run android` | [section 7](docs/DEVELOPMENT_SETUP.md#7-run-on-android) |
| Native rebuild (SDK, native dep, `app.json`, plugin change) | `npm run ios:rebuild` / `android:rebuild` | [section 5](docs/DEVELOPMENT_SETUP.md#5-run-in-the-ios-simulator) |
| Regenerate native projects without launching | `npm run native:sync` | [section 8](docs/DEVELOPMENT_SETUP.md#8-regenerate-native-projects-without-launching) |
| Quality checks | `npm run lint && npx tsc --noEmit && npm test` | |

The generated `ios/` and `android/` directories are ignored by Git; `app.json` and the Expo config plugins are their source of truth. Web (`npm run web`) is a limited fallback only: SQLite and the native Mushaf pager do not work there.
