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
  created". No branch was created.
- With a user config that also defined `new`, `wt new 9 dup` created the
  worktree through the user alias, and the project alias then failed with
  "Branch 9-dup already exists".
