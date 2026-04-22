import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine, BranchInfo } from '../core/git-engine.ts';

export async function cleanCommand() {
  const engine = new GitEngine();
  const spinner = ora('Analyzing branches...').start();

  try {
    const branches = await engine.getBranches();
    spinner.stop();

    const cleanable = branches.filter(b => (b.isMerged || b.isGone) && !b.isCurrent);

    if (cleanable.length === 0) {
      console.log(chalk.green('✔ No stale or merged branches found. Your repo is clean!'));
      return;
    }

    console.log(chalk.bold(`\nFound ${cleanable.length} branches that can be cleaned up:`));

    const choices = cleanable.map(b => ({
      name: `${b.name} ${chalk.dim(b.isMerged ? '[merged]' : '')} ${chalk.red(b.isGone ? '[gone]' : '')}`,
      value: b.name,
      checked: b.isMerged || b.isGone // Pre-check the obvious ones
    }));

    const { selectedBranches } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedBranches',
        message: 'Select branches to delete:',
        choices
      }
    ]);

    if (selectedBranches.length === 0) {
      console.log(chalk.yellow('No branches selected. Aborting.'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to delete ${selectedBranches.length} branches?`,
        default: false
      }
    ]);

    if (confirm) {
      const deleteSpinner = ora('Deleting branches...').start();
      await engine.deleteBranches(selectedBranches);
      deleteSpinner.succeed(chalk.green(`Successfully deleted ${selectedBranches.length} branches.`));
    } else {
      console.log(chalk.yellow('Cleanup cancelled.'));
    }
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to analyze branches.'));
    console.error(error.message);
  }
}
