import chalk from 'chalk';
import boxen from 'boxen';
import { GitEngine } from '../core/git-engine.ts';
import { ProfileManager } from '../core/profile-manager.ts';

export async function statusCommand() {
  const engine = new GitEngine();
  const profileManager = new ProfileManager();

  try {
    const branches = await engine.getBranches();
    const currentBranch = branches.find(b => b.isCurrent)?.name || 'Unknown';
    const localEmail = await engine.getLocalConfig('user.email');
    const stashes = await engine.getStashes();
    const worktrees = await engine.getWorktrees();
    const diffStat = await engine.getDiffStat();
    const stagedStat = await engine.getStagedDiffStat();

    // Profile detection
    const profiles = profileManager.getProfiles();
    const matchingProfile = profiles.find(p => p.email === localEmail);

    let dashboard = '';

    // Section 1: Identity
    dashboard += chalk.bold.cyan('👤 IDENTITY\n');
    dashboard += `  Profile: ${matchingProfile ? chalk.green(matchingProfile.id) : chalk.yellow('None (Custom)')}\n`;
    dashboard += `  User:    ${localEmail || chalk.red('Not set')}\n\n`;

    // Section 2: Repository
    dashboard += chalk.bold.magenta('📂 REPOSITORY\n');
    dashboard += `  Branch:    ${chalk.bold.white(currentBranch)}\n`;
    dashboard += `  Stashes:   ${stashes.length > 0 ? chalk.yellow(stashes.length) : chalk.dim('0')}\n`;
    dashboard += `  Worktrees: ${worktrees.length > 1 ? chalk.green(worktrees.length) : chalk.dim('1')}\n\n`;

    // Section 3: Changes
    dashboard += chalk.bold.yellow('📝 CHANGES\n');
    if (!diffStat && !stagedStat) {
      dashboard += `  ${chalk.dim('No changes in working directory.')}\n`;
    } else {
      if (stagedStat) {
        dashboard += chalk.green('  Staged:\n') + chalk.dim(stagedStat.split('\n').map(l => '    ' + l).join('\n')) + '\n';
      }
      if (diffStat) {
        dashboard += chalk.red('  Unstaged:\n') + chalk.dim(diffStat.split('\n').map(l => '    ' + l).join('\n')) + '\n';
      }
    }

    console.log('\n' + boxen(dashboard, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'cyan',
      title: 'Git-Mod Dashboard',
      titleAlignment: 'center'
    }));

  } catch (error: any) {
    console.error(chalk.red('\nFailed to generate status dashboard:'), error.message);
  }
}
