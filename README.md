# Git-Mod 🚀

**Git-Mod** is a powerful CLI supercharger for Git. It wraps complex Git operations into friendly, interactive commands, adds professional features like intelligent identity auto-switching, and saves you from common repository disasters.

---

## 🌟 Superpowers

### 🤖 Magic Identity (Auto-Switch)
Map specific directories to specific Git identities. Git-Mod automatically switches your local `user.email` and SSH keys the moment you enter a repository. Never accidentally push work code to personal repos again.

### 🙈 The Oops Fixer
Accidentally tracked `.env` or `node_modules`? `git mod oops` adds it to your `.gitignore`, untracks it, and automatically amends your last commit to erase the evidence.

### ✍️ Conventional Commits Wizard
Write perfect commits every time with `git mod commit`. A step-by-step wizard guides you through types, scopes, and even adding `Co-authored-by` credits for your teammates.

### 🚑 Ultimate Rescue & Time Travel
Broke your branch? Use `git mod rollback` to travel back in time, or `git mod rescue` to browse the reflog and restore lost commits instantly.

---

## 📚 Documentation

The full power of Git-Mod is detailed in our documentation. Dive in to learn more:

- 👤 **[Identity & Configuration](doc/identity.md)**: Profiles, SSH isolation, Magic Auto-Switch, and Smart Init.
- 🛠️ **[Daily Workflow](doc/daily-workflow.md)**: Commits, Status Dashboards, Merge/Squash, Stashes, and the Oops Fixer.
- 🚀 **[Advanced Operations](doc/advanced.md)**: Rescue, Bisect/Hunt, Checkpoints, Subtrees, Worktrees, and Repo Optimization.

---

## 🛠 Installation

Install **Git-Mod** globally via npm:

```bash
npm install -g git-mod
```
```bash
pnpm install -g git-mod
```
```bash
bun install -g git-mod
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
3. **Map your Magic Identity (Auto-Switch)**:
   ```bash
   git mod profile
   # Select "Manage Path Mappings"
   ```
4. **Write your first perfect commit**:
   ```bash
   git mod commit
   ```

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
