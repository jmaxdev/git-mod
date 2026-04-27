# Advanced Operations

Heavy-duty commands for complex repositories and fixing major issues.

## `git mod rescue`

The ultimate "Undo" button for catastrophic mistakes.
- Browse your repository's history (reflog) visually.
- Instantly restore your repository to any previous state via a hard reset, or create a new "rescue" branch to inspect the lost state safely.

## `git mod hunt`

A high-level wizard for `git bisect`.
- Visually navigate through your recent commits to mark "good" and "bad" states.
- Find the exact change that introduced a bug without remembering the complex bisect commands.

## `git mod checkpoint`

A "Save Game" feature for your repository.
- Create named snapshots of your current state (e.g., `before-refactor`).
- Creates a uniquely timestamped tag. You can easily jump back to this tag using `git mod rescue` or `git mod rollback` if things go wrong.

## `git mod subtree`

An interactive manager for Git Subtrees.
- Add, pull, and push external repositories into subdirectories of your main project.
- Automatically handles the complex `--prefix` and `--squash` flags.

## `git mod worktree`

Context switching made easy. 
- List, add, and remove Git worktrees.
- Work on multiple branches simultaneously in different physical directories without having to stash your current work.

## `git mod sparse`

Optimize large repositories by only checking out the directories you need.
- Uses modern "cone" mode sparse-checkout.
- Interactively add directories you want to fetch and hide the rest, massively improving performance on monorepos.

## `git mod optimize`

Keep your repository healthy.
- Runs `git gc` and `git maintenance` tasks.
- Automatically prunes unreachable objects and optimizes the local object database for speed.

## `git mod sync`

Keep your local repository perfectly aligned with the remote in one go.
- Fetches all remotes.
- Prunes stale tracking branches.
- Rebases the current branch onto its upstream.
- Recursively initializes and updates submodules.

## `git mod clean`

Interactive branch cleanup.
- Scans your local branches and compares them against the remote.
- Interactively select and delete branches that have already been merged or no longer exist on the remote.
