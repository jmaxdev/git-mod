import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function mergeCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n🤝 Git-Mod Merge: Interactive Integration'));

  try {
    const branchData = await engine.getBranches();
    const otherBranches = branchData.filter(b => !b.isCurrent).map(b => b.name);

    if (otherBranches.length === 0) {
      console.log(chalk.yellow('No other branches found to merge.'));
      return;
    }

    const { branch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'branch',
        message: 'Select branch to merge INTO current branch:',
        choices: otherBranches
      }
    ]);

    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Merge type:',
        choices: [
          { name: 'Standard Merge (Keep history, creates merge commit)', value: 'standard' },
          { name: 'Squash & Merge (Combine all changes into ONE single commit)', value: 'squash' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (type === 'cancel') return;

    if (type === 'squash') {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'Commit message for the squashed changes:',
          default: `Merge branch '${branch}' into ${branchData.find(b => b.isCurrent)?.name}`
        }
      ]);

      const spinner = ora(`Squashing and merging ${branch}...`).start();
      await engine.squashMerge(branch, message);
      spinner.succeed(chalk.green(`\n✔ Branch ${branch} squashed and merged.`));
    } else {
      const spinner = ora(`Merging ${branch}...`).start();
      try {
        await engine.merge(branch);
        spinner.succeed(chalk.green(`\n✔ Branch ${branch} merged.`));
      } catch (e: any) {
        spinner.fail(chalk.red('Merge failed. You might have conflicts!'));
        console.error(e.message);
      }
    }
  } catch (error: any) {
    console.error(chalk.red('\nMerge failed:'), error.message);
  }
}
