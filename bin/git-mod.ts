#!/usr/bin/env node
import { Command } from 'commander';
import { syncCommand } from '../src/commands/sync.ts';
import { initCommand } from '../src/commands/init.ts';
import { cleanCommand } from '../src/commands/clean.ts';
import { rescueCommand } from '../src/commands/rescue.ts';
import { huntCommand } from '../src/commands/hunt.ts';
import { worktreeCommand } from '../src/commands/worktree.ts';
import { switchCommand } from '../src/commands/switch.ts';
import { restoreCommand } from '../src/commands/restore.ts';
import { profileCommand } from '../src/commands/profile.ts';
import { remoteCommand } from '../src/commands/remote.ts';
import { stashCommand } from '../src/commands/stash.ts';
import { sparseCommand } from '../src/commands/sparse.ts';
import { optimizeCommand } from '../src/commands/optimize.ts';
import { rollbackCommand } from '../src/commands/rollback.ts';
import { mergeCommand } from '../src/commands/merge.ts';
import { commitCommand } from '../src/commands/commit.ts';
import { checkpointCommand } from '../src/commands/checkpoint.ts';
import { subtreeCommand } from '../src/commands/subtree.ts';
import { statusCommand } from '../src/commands/status.ts';
import { ignoreCommand } from '../src/commands/ignore.ts';
import { logger } from '../src/utils/logger.ts';
import { ProfileManager } from '../src/core/profile-manager.ts';
import { GitEngine } from '../src/core/git-engine.ts';
import chalk from 'chalk';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const program = new Command();

program
  .name('git-mod')
  .description('A mod for git')
  .version(pkg.version);

// Register commands
program
  .command('init')
  .description('Smart Git Init: initialize repo and generate .gitignore')
  .action(initCommand);

program
  .command('sync')
  .description('Super-sync: Fetch, Prune, Rebase and update Submodules')
  .option('-p, --no-prune', 'Disable pruning of remote branches')
  .option('-r, --no-rebase', 'Disable rebasing of current branch')
  .action(syncCommand);

program
  .command('clean')
  .description('Interactive cleanup of merged or stale branches')
  .action(cleanCommand);

program
  .command('rescue')
  .description('Interactive "Undo": Browse reflog and restore repository states')
  .action(rescueCommand);

program
  .command('hunt')
  .description('Friendly bisect wizard to find the commit that introduced a bug')
  .action(huntCommand);

program
  .command('worktree')
  .description('Manage worktrees for instant context switching')
  .action(worktreeCommand);

program
  .command('switch')
  .description('Interactive branch switcher (wrapper for git switch)')
  .action(switchCommand);

program
  .command('restore')
  .description('Interactive file restorer (wrapper for git restore)')
  .action(restoreCommand);

program
  .command('profile')
  .description('Manage multiple git identities (profiles)')
  .action(profileCommand);

program
  .command('remote')
  .description('Interactive remote repository manager')
  .action(remoteCommand);

program
  .command('stash')
  .description('Interactive stash manager: list, create, apply and drop')
  .action(stashCommand);

program
  .command('sparse')
  .description('Wizard for sparse-checkout: optimize large repositories')
  .action(sparseCommand);

program
  .command('optimize')
  .description('Run repository maintenance and cleanup (gc, prune)')
  .action(optimizeCommand);

program
  .command('rollback [commit]')
  .description('Rollback current branch to a specific commit or select from list')
  .action(rollbackCommand);

program
  .command('merge')
  .description('Interactive merge manager with squash option')
  .action(mergeCommand);

program
  .command('commit')
  .description('Conventional Commits wizard: write perfect messages')
  .action(commitCommand);

program
  .command('checkpoint')
  .description('Create a named snapshot of current repository state')
  .action(checkpointCommand);

program
  .command('subtree')
  .description('Interactive subtree manager for external repositories')
  .action(subtreeCommand);

program
  .command('status')
  .description('Fancy repository status dashboard')
  .action(statusCommand);

program
  .command('ignore [path]')
  .alias('oops')
  .description('Untrack a file/folder, add it to .gitignore, and optionally amend the last commit')
  .action(ignoreCommand);

async function checkAutoSwitch() {
  const profileManager = new ProfileManager();
  const engine = new GitEngine();
  
  const targetProfileId = profileManager.getProfileByPath(process.cwd());
  if (!targetProfileId) return;

  const localEmail = await engine.getLocalConfig('user.email');
  const profiles = profileManager.getProfiles();
  const targetProfile = profiles.find(p => p.id === targetProfileId);

  if (targetProfile && targetProfile.email !== localEmail) {
    console.log(chalk.bold.cyan('🤖 Magic Identity:'));
    console.log(`   Switching to profile '${chalk.green(targetProfileId)}' for this directory...`);
    
    try {
      await engine.setConfig('user.name', targetProfile.name, 'local');
      await engine.setConfig('user.email', targetProfile.email, 'local');
      if (targetProfile.sshKey) {
        await engine.setSSHCommand(targetProfile.sshKey, 'local');
      }
      console.log(chalk.dim('   Done.\n'));
    } catch (e: any) {
      console.log(chalk.red(`   Failed to auto-switch: ${e.message}\n`));
    }
  }
}

// Run auto-switch before parsing commands
await checkAutoSwitch();

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  logger.brand();
  program.outputHelp();
}
