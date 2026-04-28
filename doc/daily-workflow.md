# Daily Workflow

These are the commands you will use every day to interact with your codebase, make changes, and keep things tidy.

## `git mod commit`

A Conventional Commits wizard that ensures your history is readable and standardized.
- **Integrated Workflow**: Optionally stage all changes (`git add .`) before starting.
- **Guided Prompts**: Select the type (`feat`, `improvement`, `fix`, `chore`, etc.), scope, and subject.
- **Co-Authors**: Easily add `Co-authored-by` trailers. If you have default co-authors configured via `git mod config`, you can select them with one click.
- **Semantic Versioning**: After committing, if you choose to push, Git-Mod will detect your `package.json` and offer to increment your version (**Major**, **Minor**, or **Patch**). It automatically updates your `package.json`.
- **Integrated Changelog**: Once a version is selected, Git-Mod offers to add the new commit directly to `CHANGELOG.md` under the new version header.
- **Auto-Amend**: Both the version bump in `package.json` and the `CHANGELOG.md` update are automatically amended into your last commit, keeping your history clean and atomic.
- **Auto-Push & Tagging**: Optionally push to the remote immediately, automatically creating and pushing the Git tag (e.g., `v1.2.3`) alongside your commit.

## `git mod changelog`

Generate a professional `CHANGELOG.md` in seconds.
- **History Analysis**: Scans all commits since your last Git tag.
- **Semantic Classification**: Groups commits into Features, Bug Fixes, and Breaking Changes.
- **Interactive Versioning**: Prompts for the next version number and handles the `v` prefix automatically.
- **Release Ready**: Updates the file and creates the corresponding Git tag for you.

## `git mod status`

A beautiful, high-level dashboard of your repository state.
- **Identity Check**: Quickly see which profile is currently active and which email/GPG key is being used.
- **Repo Stats**: Summary of branches, stashes, and worktrees.
- **Dirty State**: At-a-glance view of modified or untracked files.

## `git mod rollback`

The "oops" button for your commits.
- **Multiple Modes**: Choose between `Soft`, `Mixed`, or `Hard` resets.
- **Interactive UI**: Select how far back you want to go without remembering SHA hashes.

## `git mod ignore` (alias `oops`)

The surgical tool for cleaning up your repository.
- **Untrack & Ignore**: Removes files from Git tracking without deleting them from your disk, and optionally adds them to `.gitignore`.
- **History Eraser**: If you accidentally committed a secret or a huge folder, use the `Auto-Amend` feature to erase it from the last commit as if it never happened.

## `git mod config`

Personalize your Git-Mod experience. Persistent settings are stored in `~/.gitmodrc`.
- **Workflow Automation**: Toggle `autoPush`, `tagAfterCommit`, and `autoChangelog` behavior.
- **Default Co-Authors**: Manage a list of teammates you frequently pair with.
- **Identity Logic**: Toggle the `autoSwitch` magic identity behavior.

## `git mod stash`

Visual management of your stashed changes.
- List stashes with readable dates and messages.
- Apply, pop, or drop stashes without having to memorize `stash@{0}` indices.

## `git mod merge`

Smart, interactive merging.
- Lists available branches to merge into your current branch.
- **Standard Merge**: Performs a regular merge.
- **Squash & Merge**: Combines all changes from the target branch into a single, clean commit on your current branch.
