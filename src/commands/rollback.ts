import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function rollbackCommand(commit?: string) {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n⏪ Git-Mod Rollback: Time Traveler'));

  try {
    let targetHash = commit;

    if (!targetHash) {
      const spinner = ora('Reading commit history...').start();
      const commits = await engine.getRecentCommits(30);
      spinner.stop();

      if (commits.length === 0) {
        console.log(chalk.yellow('No commits found in current branch.'));
        return;
      }

      const { selectedCommit } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedCommit',
          message: 'Select the commit you want to roll back to:',
          choices: commits.map(c => ({
            name: `${chalk.yellow(c.hash.substring(0, 7))} - ${c.message} ${chalk.dim(`(${new Date(c.date).toLocaleString()})`)}`,
            value: c.hash
          }))
        }
      ]);
      targetHash = selectedCommit;
    }

    // Show details of the target commit
    console.log(chalk.dim('\nTarget state:'));
    const details = await engine.getCommitDetails(targetHash!);
    console.log(chalk.gray(details.split('\n').slice(0, 10).join('\n')));

    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'How do you want to rollback?',
        choices: [
          { name: 'Mixed (Keep changes in files, but unstage them) - RECOMMENDED', value: 'mixed' },
          { name: 'Soft (Keep changes staged, ready to commit again)', value: 'soft' },
          { name: 'Hard (Discard all changes, match the commit exactly) - DANGEROUS', value: 'hard' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (mode === 'cancel') return;

    if (mode === 'hard') {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red('WARNING: This will permanently discard all uncommitted changes. Proceed?'),
          default: false
        }
      ]);
      if (!confirm) return;
    }

    const spinner = ora(`Rolling back to ${targetHash!.substring(0, 7)}...`).start();
    await engine.rollback(targetHash!, mode as any);
    spinner.succeed(chalk.green(`\n✔ Successfully rolled back to ${targetHash!.substring(0, 7)}.`));
    
    if (mode === 'mixed' || mode === 'soft') {
      console.log(chalk.cyan('Your changes from later commits are now in your working directory.'));
    }
  } catch (error: any) {
    console.error(chalk.red('\nRollback failed:'), error.message);
  }
}
