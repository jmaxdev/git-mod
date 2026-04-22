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
import { logger } from '../src/utils/logger.ts';

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

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  logger.brand();
  program.outputHelp();
}
