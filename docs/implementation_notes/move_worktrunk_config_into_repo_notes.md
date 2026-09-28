# Worktrunk config in the repo

The Worktrunk settings for this repo live in `.config/wt.toml`, including the
`wt new` alias. No user config is needed.

## Decisions

**`wt new` is a project alias.** It used to come from a user config, and this
repo only supplied an `env-prefix` alias that the user alias called. That
split meant a clone got no `wt new` at all. The project alias now does the
whole job: it names the branch, fetches `origin`'s default branch, and creates
the worktree from the fetched commit.

**The naming stays the same.** `wt new 12` gives `12-<slug from the issue
title>`, `wt new 12 fix ports` gives `12-fix-ports`, and words with no number
give a plain kebab name. `wt new '#12'` is still refused. Its first error line
is unchanged. The second line used to explain how the user alias would read
`#12`, and that alias is gone, so the line now says that branch names start
with the plain issue number.

**A user config must not also define `aliases.new`.** Worktrunk 0.79 runs both
bodies, the user one first. The second one then fails because the branch
already exists. An earlier comment in this file said a project alias with the
same name is ignored. That is not true in 0.79, and the comment is gone.

**The logic stays in `.config/wt.toml`.** A tracked script called from a
one-line alias would be easier to lint. But Worktrunk approves the alias text,
not the script, so an edited script would then run with no new approval.

## Verification

The test used a throwaway clone whose `origin` was a local bare repository.
Its `.config/wt.toml` held the same aliases as this branch, with the project
hooks removed so that no `npm install` or Simulator device ran. The user config
was the new global config with no `new` alias, passed through
`WORKTRUNK_CONFIG_PATH` so the inner `wt switch` read it too. `origin` was one
commit ahead of the clone's `main`.

- `wt config alias show` listed one `new`, from `(project)`, in the clone and in
  a created worktree.
- `wt new 12 fix ports` created `12-fix-ports`.
- `wt new fix ports` created `fix-ports`. The first draft named it
  `-fix-ports`, and `wt switch` rejected that as an option. The fix went in
  before the commit.
- `wt new 24` read issue 24 from GitHub and created
  `24-live-practice-session-end`.
- `wt new --clobber 7 add login` printed a note about the flag and created
  `7-add-login`.
- `wt new '#12'` exited 3 with the hash message. `wt new` with no words exited
  2 with the usage line.
- Every created branch pointed at `origin`'s new commit, not at the clone's
  older `main`.
- With `origin` pointed at a missing repository, `wt new 13 broken origin`
  exited 1 with "could not fetch origin's current default branch; no worktree
  created". It created no branch.
- With a user config that also defined `new`, `wt new 9 dup` created the
  worktree through the user alias, and the project alias then failed with
  "Branch 9-dup already exists".

## Simulator device check

A review found that the `simulator` post-start hook counted an unavailable
device as an existing one. `simctl list devices` still lists a device after its
runtime is removed, marked unavailable. The hook then skipped creation, and the
worktree had no device that could boot.

**The check reads `simctl list devices available`.** An unavailable device with
the worktree's name no longer blocks a new one.

**`pre-remove.simulator` deletes every device with the worktree's name.** After
the fix, a stale device and its replacement can share one name. The old hook
deleted only the first match and left the other behind.

The fix was tested with a stub `xcrun`, because this machine has no Xcode. The stub keeps
its devices in a state file and lists unavailable ones under an `Unavailable`
runtime header, the way `simctl` does.

- With a stale unavailable `alfurqan 12-fix-ports`, the old hook printed
  "Simulator device already exists" and created nothing. The new hook created
  a device and wrote its UDID to `.simulator-udid`.
- A second run of the new hook found the new device and created no other.
- With two devices named `alfurqan 12-fix-ports` and one named
  `alfurqan 12-fix-ports-2`, the old `pre-remove` deleted one and left the
  other. The new one deleted both and kept `alfurqan 12-fix-ports-2`.

## Quality passes

These passes ran on the whole diff against `origin/main`.

- The dead-code pass removed `[ -d "$dir" ] || continue` from
  `pre-remove.derived-data`. The `[ -f "$plist" ]` test on the next line already
  skips every path that is not a directory. It deferred `grep -v unavailable` in
  the runtime lookup, because without Xcode nothing shows whether
  `simctl list runtimes available` can print an unavailable runtime.
- `simplify` dropped the `grep -E "^iOS "` stage from the runtime lookup. The
  final `grep -oE` matches only iOS runtime IDs, and `tail -1` now runs after
  it. It also added a comment on `pre-remove.simulator` saying that the
  post-start hook must build the same device name.
- A stub `xcrun` and a fake `DerivedData` folder gave the same results before
  and after these edits. The runtime lookup still picks the newest iOS runtime
  when a watchOS runtime is listed after it.
- The comment pass cut each comment in `.config/wt.toml` to 22 words or fewer.
  It also fixed the comment above `aliases.new`, which said that
  `scripts/expo-run.mjs` hashes the worktree path. `wt metro-port` hashes the
  repository and branch names. A `tomllib` comparison with comment lines
  stripped showed that every command body is unchanged by that pass.
