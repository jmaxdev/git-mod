import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { GitEngine } from '../core/git-engine.ts';

export async function worktreeCommand() {
  const engine = new GitEngine();
  const spinner = ora('Reading worktrees...').start();

  try {
    const worktrees = await engine.getWorktrees();
    spinner.stop();

    console.log(chalk.bold.cyan('\n🌳 Git-Mod Switch: Worktree Manager'));
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'List all worktrees', value: 'list' },
          { name: 'Add new worktree', value: 'add' },
          { name: 'Remove a worktree', value: 'remove' },
          { name: 'Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (action === 'cancel') return;

    if (action === 'list') {
      console.log('\n' + chalk.bold('Current Worktrees:'));
      worktrees.forEach(w => {
        console.log(`${chalk.green('•')} ${chalk.yellow(w.branch || 'DETACHED')} at ${chalk.dim(w.path)}`);
      });
    } else if (action === 'add') {
      const { branch } = await inquirer.prompt([
        {
          type: 'input',
          name: 'branch',
          message: 'Branch name for the new worktree:',
          validate: (input) => input.length > 0 || 'Branch name cannot be empty.',
          filter: (val) => val.trim()
        }
      ]);

      const defaultPath = `../${branch}-worktree`;
      const { worktreePath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'worktreePath',
          message: 'Path for the new worktree:',
          default: defaultPath,
          filter: (val) => val.trim()
        }
      ]);

      const addSpinner = ora('Adding worktree...').start();
      await engine.addWorktree(worktreePath, branch);
      addSpinner.succeed(chalk.green(`Worktree created at ${worktreePath} for branch ${branch}.`));
    } else if (action === 'remove') {
      if (worktrees.length <= 1) {
        console.log(chalk.yellow('No extra worktrees to remove.'));
        return;
      }

      const { toRemove } = await inquirer.prompt([
        {
          type: 'list',
          name: 'toRemove',
          message: 'Select worktree to remove:',
          choices: worktrees.slice(1).map(w => ({
            name: `${w.branch} (${w.path})`,
            value: w.path
          }))
        }
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.red(`Are you sure you want to remove ${toRemove}?`),
          default: false
        }
      ]);

      if (confirm) {
        const rmSpinner = ora('Removing worktree...').start();
        await engine.removeWorktree(toRemove);
        rmSpinner.succeed(chalk.green('Worktree removed.'));
      }
    }
  } catch (error: any) {
    spinner.fail(chalk.red('Worktree operation failed.'));
    console.error(error.message);
  }
}
