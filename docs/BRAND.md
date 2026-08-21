# Brand

## Identity

| Field | Value |
|---|---|
| **Full brand name** | Mushaf Al Furqan |
| **Arabic** | مصحف الفرقان |
| **Short name** | Al Furqan |
| **Wordmark** | الفرقان |
| **Meaning** | *Al-Furqān* ("The Criterion") is one of the Quran's own names. Surah 25 is named الفرقان. *Mushaf* is the bound, written form of the Quran. Together: "The Mushaf of The Criterion" — a dignified, unambiguously-Islamic identity. |

## Transliteration rules

Pick one spelling and use it everywhere. Mixed spellings fragment search, social handles, and SEO.

| Context | Canonical form |
|---|---|
| Display (UI, marketing, docs) | **Al Furqan** (space, no hyphen) |
| URLs, handles, package names | **alfurqan** (lowercase, no space) |
| Arabic script | **الفرقان** (no space; the *alif-lām* is part of the word) |

**Do not use:** Furqaan, Furkan (Turkish transliteration), Al-Furqan (hyphenated), AlFurqan (camelCase).

## Display tiers

Different surfaces get different versions of the name. This keeps the full brand dignified while giving space-constrained surfaces something short.

| Tier | Name shown | Where |
|---|---|---|
| **Full brand** | Mushaf Al Furqan (مصحف الفرقان) | Splash screen, about page, marketing site, press |
| **App store / home screen** | Al Furqan | iOS/Android app name (≤12 chars renders cleanly under the icon) |
| **Conversational / voice** | Al Furqan | "Open Al Furqan" |
| **Logo / icon wordmark** | الفرقان *or* Al Furqan | Design choice — Arabic wordmark reads strongest for primary audience |

## Rename status

**2026-08-21 note.** The rename shipped. Commit `5dd092e` on 2026-04-24 moved `app.json` and `package.json` off the working title `tasmi`. The old touchpoint checklist that stood here is replaced by the shipped values below, read from `app.json` and `package.json` on this date.

| File | Key | Current value |
|---|---|---|
| `app.json` | `expo.name` | `"Al Furqan"` |
| `app.json` | `expo.slug` | `"alfurqan"` |
| `app.json` | `expo.scheme` | `"alfurqan"` |
| `app.json` | `expo.ios.bundleIdentifier` | `"com.alfurqan.app"` |
| `app.json` | `expo.android.package` | `"com.alfurqan.app"` |
| `package.json` | `name` | `"alfurqan"` |

**The two platforms share one identifier, on purpose.** Both iOS and Android use `com.alfurqan.app`.

The iOS value drifted for a while. Commit `5dd092e` set `com.alfurqan.app` on 2026-04-24, `e051616` changed it to `com.ahmeddaraz.alfurqan` on 2026-04-27, most likely to sign under a free Apple Personal Team, and it was unified back on 2026-08-21. Unifying was cheap because the app had never been submitted to either store and the only install was a local Simulator.

Treat this identifier as frozen from the first store submission onward. Apple does not allow a shipped bundle identifier to change, and Google does not allow a shipped `applicationId` to change. After launch, changing either one means a new store listing and abandoning the existing users, because the identifier is the app's identity: a different value installs a second app beside the first rather than updating it, and the original's MMKV settings and SQLite data stay locked in the old container.

Also done: the repo directory reads `alfurqan`, and the git remote is `git@github.com:arDaraz/alfurqan.git`.

Still open: the icon, splash, and favicon assets under `assets/images/` and `assets/expo.icon` have not changed since the rename. They still need design work, which is not a find and replace. The `.planning/**` docs keep saying `tasmi` on purpose, because they are the historical paper trail.

## Decision log

- **2026-04-24** — Brand locked as **Mushaf Al Furqan**. Chosen from Round 1 brainstorm (20 candidates across 5 semantic neighborhoods). The *Furqan* anchor aligns with the user's "balanced trinity" goal — it names the Quran itself rather than privileging recitation, verification, or reading. Repository rename deferred to a separate task.
