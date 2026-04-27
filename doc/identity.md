# Identity & Configuration

Managing your Git identity across personal, work, and open-source projects can be a hassle. **Git-Mod** solves this with centralized profiles and smart path mapping.

## `git mod profile`

The profile manager is the heart of Git-Mod's identity system. It allows you to create, edit, list, and delete identity profiles.

**Key Features:**
- **No URL Aliases Needed**: Keep using standard URLs like `git@github.com:user/repo.git`. No need to change them to `git@github-work:...`.
- **Localized Config**: Applies identity (`user.name`, `user.email`) locally to the repository.
- **Smart SSH Isolation**: Uses `core.sshCommand` to ensure each repo uses the correct private key without global SSH config hacks.
- **Native Signing**: Support for SSH-based commit signing for that "Verified" badge on GitHub.
- **Dynamic Key Generation**: Built-in wizard to generate secure Ed25519 keys with unique IDs.

### 🤖 Magic Identity (Auto-Switch)

You no longer need to remember to run `git mod profile` in every new repository.

1. Run `git mod profile`.
2. Select **Manage Path Mappings (Auto-Switch)**.
3. Map a directory (e.g., `C:\Work`) to a profile (e.g., `work-profile`).

Now, whenever you run **any** `git mod` command inside `C:\Work` (or any of its subdirectories), Git-Mod will automatically switch your local Git config to use `work-profile`.

## `git mod remote`

Interactively manage your repository remotes.
- Add, rename, or delete remotes visually.
- Link them to your identity profiles in one flow.

## `git mod init`

Don't just `git init`, initialize with intelligence.
- **Guided .gitignore**: Interactive selection of templates (Node.js, Python, Go, Universal).
- **Lockfile Policy**: Choose whether to ignore lock files based on your team's workflow.
- **Safe Init**: Detects existing repositories and focuses on configuration.
