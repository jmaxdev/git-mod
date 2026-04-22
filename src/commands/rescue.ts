import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function rescueCommand() {
  const engine = new GitEngine();
  const spinner = ora('Reading reflog...').start();

  try {
    const entries = await engine.getReflog(30);
    spinner.stop();

    if (entries.length === 0) {
      console.log(chalk.yellow('No reflog entries found.'));
      return;
    }

    const { selectedEntry } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedEntry',
        message: 'Select a state to rescue (most recent first):',
        choices: entries.map(e => ({
          name: `${chalk.cyan(e.hash)} ${chalk.yellow(e.ref)}: ${e.description}`,
          value: e
        }))
      }
    ]);

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: `What do you want to do with state ${selectedEntry.hash}?`,
        choices: [
          { name: 'Restore completely (git reset --hard) - DANGEROUS', value: 'reset' },
          { name: 'Create new branch from this state', value: 'checkout' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') return;

    if (action === 'reset') {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red('WARNING: This will discard all uncommitted changes. Proceed?'),
          default: false
        }
      ]);

      if (confirm) {
        await engine.restoreState(selectedEntry.hash, 'reset');
        console.log(chalk.green(`✔ Project restored to state ${selectedEntry.hash}.`));
      }
    } else if (action === 'checkout') {
      const { branchName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'branchName',
          message: 'Enter name for the new branch:',
          validate: (input) => input.length > 0 || 'Branch name cannot be empty.'
        }
      ]);

      await engine.restoreState(selectedEntry.hash, 'checkout', branchName);
      console.log(chalk.green(`✔ Created branch ${branchName} from state ${selectedEntry.hash}.`));
    }
  } catch (error: any) {
    spinner.fail(chalk.red('Failed to rescue state.'));
    console.error(error.message);
  }
}
