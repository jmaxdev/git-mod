# Git-Mod 🚀

**Git-Mod** is a powerful CLI supercharger for Git, designed to streamline advanced workflows, manage multiple identities, and provide interactive tools for repository maintenance.

It wraps complex Git operations into friendly, interactive commands while adding professional features like identity profiling and smart initialization.

---

## 🌟 Key Features

### 👤 Identity Profiles (`git mod profile`)
Effortlessly switch between multiple Git accounts (Work, Personal, Client, etc.).
- **Localized Config**: Applies identity (`user.name`, `user.email`) locally to the repository.
- **Smart SSH Isolation**: Uses `core.sshCommand` to ensure each repo uses the correct private key without global SSH config hacks.
- **Native Signing**: Support for SSH-based commit signing for that "Verified" badge on GitHub.
- **Key Generation**: Built-in wizard to generate secure Ed25519 keys with standard `git_` prefixes.

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
This project is licensed under the ISC License.
