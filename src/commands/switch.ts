import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function switchCommand() {
  const engine = new GitEngine();
  const spinner = ora('Fetching branches...').start();

  try {
    const branches = await engine.getBranches();
    spinner.stop();

    const { targetBranch } = await inquirer.prompt([
      {
        type: 'list',
        name: 'targetBranch',
        message: 'Select branch to switch to:',
        choices: branches.map(b => ({
          name: `${b.isCurrent ? chalk.green('●') : ' '} ${b.name} ${b.isMerged ? chalk.dim('[merged]') : ''}`,
          value: b.name,
          disabled: b.isCurrent
        }))
      }
    ]);

    const switchSpinner = ora(`Switching to ${targetBranch}...`).start();
    // Using native 'git switch' through raw command
    const git = (engine as any).git; // Access internal git instance
    await git.raw(['switch', targetBranch]);
    switchSpinner.succeed(chalk.green(`Switched to branch '${targetBranch}'`));
  } catch (error: any) {
    spinner.stop();
    console.error(chalk.red('\n✖ Switch failed:'), error.message);
  }
}
