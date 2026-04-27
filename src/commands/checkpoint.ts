import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function checkpointCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n💾 Git-Mod Checkpoint: Save Your Progress'));
  console.log(chalk.dim('Create a named snapshot of your current state.\n'));

  try {
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Checkpoint name (e.g. before-refactor):',
        validate: (input) => /^[a-zA-Z0-9_-]+$/.test(input) || 'Name must be alphanumeric with dashes/underscores.',
        filter: (val) => val.trim()
      }
    ]);

    const spinner = ora('Creating checkpoint...').start();
    const tagName = await engine.createCheckpoint(name);
    spinner.succeed(chalk.green(`\n✔ Checkpoint '${name}' created!`));
    console.log(`${chalk.dim('Tag:')} ${chalk.yellow(tagName)}`);
    console.log(chalk.dim('\nYou can always return here using "git mod rescue" or "git mod rollback".'));
  } catch (error: any) {
    console.error(chalk.red('\nCheckpoint failed:'), error.message);
  }
}
