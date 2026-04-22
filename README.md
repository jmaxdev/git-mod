# Git-Mod 🚀

**Git-Mod** is a powerful CLI supercharger for Git, designed to streamline advanced workflows, manage multiple identities, and provide interactive tools for repository maintenance.

It wraps complex Git operations into friendly, interactive commands while adding professional features like identity profiling and smart initialization.

---

## 🌟 Key Features

### 👤 Identity Profiles (`git mod profile`)
- **Interactive Management**: Add, edit, list, and delete profiles through a friendly interactive menu.
- **No URL Aliases Needed**: Keep using standard URLs like `git@github.com:user/repo.git`. No need to change them to `git@github-work:...`.
- **Localized Config**: Applies identity (`user.name`, `user.email`) locally to the repository or globally.
- **Smart SSH Isolation**: Uses `core.sshCommand` to ensure each repo uses the correct private key without global SSH config hacks.
- **Native Signing**: Support for SSH-based commit signing for that "Verified" badge on GitHub. (Requires uploading your public key to GitHub as a **Signing Key**).
- **Dynamic Key Generation**: Built-in wizard to generate secure Ed25519 keys with unique IDs and automatic cleanup of old keys when replaced.
- **Immediate Sync**: Option to apply profile changes to your repository immediately after editing.

> [!TIP]
> **The Identity Advantage**: Unlike the traditional method that requires editing `~/.ssh/config` and using custom Host aliases, **Git-Mod** overrides the SSH command at the repository level. This means you can have different identities for different projects while using the exact same remote URLs.

> [!TIP]
> **Privacy First**: If you want to keep your email private on GitHub, use your GitHub-provided "noreply" email (e.g., `123456+username@users.noreply.github.com`). You can find this in your GitHub **Settings > Emails**.


### 🚀 Smart Initialization (`git mod init`)
Don't just `git init`, initialize with intelligence.
- **Guided .gitignore**: Interactive selection of templates (Node.js, Python, Go, Universal).
- **Lockfile Policy**: Choose whether to ignore lock files based on your team's workflow.
- **Safe Init**: Detects existing repositories and focuses on configuration.

### ✨ Super-Sync (`git mod sync`)
Keep your local repository perfectly aligned with the remote in one go.
- Fetches all remotes and prunes stale tracking branches.
- Rebases current branch onto its upstream.
- Recursively initializes and updates submodules.

### 🧹 Interactive Cleanup (`git mod clean`)
Keep your branch list tidy. Interactively scan and remove branches that have been merged or deleted on the remote.

### 🚑 Rescue (`git mod rescue`)
The ultimate "Undo" button. Browse your repository's history (reflog) and instantly restore it to any previous state via hard reset or by creating a rescue branch.

### 🏹 Hunt (`git mod hunt`)
A high-level wizard for `git bisect`. Visually navigate through your recent commits to find the exact change that introduced a bug.

### 🌳 Worktree Manager (`git mod worktree`)
Context switching made easy. List, add, and remove Git worktrees to work on multiple branches simultaneously in different directories.

### 🌐 Remote Manager (`git mod remote`)
Interactively manage your repository remotes and link them to your identity profiles in one flow.

---

## 🛠 Installation

Install **Git-Mod** globally via npm:

```bash
npm install -g git-mod
```

Or run it instantly without installing:

```bash
npx git-mod init
```

---

## 🚦 Quick Start

1. **Initialize your repo**:
   ```bash
   git mod init
   ```
2. **Setup your identities**:
   ```bash
   git mod profile add
   ```
3. **Apply a profile locally**:
   ```bash
   git mod profile use
   ```

---

## 📖 Usage

Invoke the mod using:
```bash
git mod <command>
```

Run `git mod --help` for a full list of available commands and options.

---

## 🏗 Technology Stack
- **Runtime**: Node.js
- **Language**: TypeScript
- **Bundler**: [tsup](https://tsup.egoist.dev/) (esbuild-powered)
- **CLI Framework**: [Commander.js](https://github.com/tj/commander.js/)
- **Interactions**: [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/)
- **Git Core**: [simple-git](https://github.com/steveukx/git-js)

## 📄 License
This project is licensed under the **UnSetSoft Public License (UPL) 1.0**. See the [LICENSE.md](LICENSE.md) file for details.

## 🤝 Contributing
Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 👥 Contributors

<a href="https://github.com/jmaxdev/git-mod/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=jmaxdev/git-mod" />
</a>

---

