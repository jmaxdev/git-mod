# Daily Workflow

These are the commands you will use every day to interact with your codebase, make changes, and keep things tidy.

## `git mod commit`

A Conventional Commits wizard that ensures your history is readable and standardized.
- **Integrated Workflow**: Optionally stage all changes (`git add .`) before starting.
- **Guided Prompts**: Select the type (`feat`, `fix`, `chore`, etc.), scope, and subject.
- **Co-Authors**: Easily add `Co-authored-by` trailers to give credit to your team.
- **Auto-Push**: Optionally push to the remote immediately after a successful commit.

## `git mod status`

A fancy, boxed dashboard that gives you a bird's-eye view of your repository.
- Shows your active identity and whether a Magic Identity mapping is in effect.
- Displays the current branch, number of stashes, and active worktrees.
- Provides a clean `diff --stat` view of staged and unstaged changes.

## `git mod ignore` (or `git mod oops`)

The **Oops Fixer**. Did you accidentally track a `.env` file or a massive `node_modules` folder?
- Adds the path to `.gitignore` automatically.
- Runs `git rm -r --cached` to untrack the file without deleting it from your disk.
- **Auto-Amend**: If you made the mistake in your very last commit, it offers to automatically `commit --amend` to erase the evidence from your Git history.

## `git mod stash`

Visual management of your stashed changes.
- List stashes with readable dates and messages.
- Apply, pop, or drop stashes without having to memorize `stash@{0}` indices.

## `git mod merge`

Smart, interactive merging.
- Lists available branches to merge into your current branch.
- **Standard Merge**: Performs a regular merge.
- **Squash & Merge**: Combines all changes from the target branch into a single, clean commit on your current branch.

## `git mod rollback [commit]`

The definitive time machine. Revert your branch to any previous commit.
- **Interactive Selection**: If no commit hash is provided, choose from a visual list of your recent history.
- **Smart Modes**: Choose between:
  - `Mixed`: Keep changes in your working directory, but unstage them.
  - `Soft`: Keep changes staged and ready to commit.
  - `Hard`: Clean slate. Destroy all changes and match the commit exactly.
