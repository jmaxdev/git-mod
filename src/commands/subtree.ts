import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function subtreeCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n🌳 Git-Mod Subtree: External Repository Manager'));

  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '➕ Add a new subtree', value: 'add' },
          { name: '📥 Pull updates from subtree', value: 'pull' },
          { name: '📤 Push changes to subtree', value: 'push' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    const { prefix, remote, branch } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prefix',
        message: 'Subtree prefix (local folder path):',
        validate: (input) => input.length > 0 || 'Prefix is required.'
      },
      {
        type: 'input',
        name: 'remote',
        message: 'Remote repository URL or name:',
        validate: (input) => input.length > 0 || 'Remote is required.'
      },
      {
        type: 'input',
        name: 'branch',
        message: 'Remote branch:',
        default: 'main'
      }
    ]);

    const spinner = ora(`${action === 'add' ? 'Adding' : action === 'pull' ? 'Pulling' : 'Pushing'} subtree...`).start();
    
    try {
      if (action === 'add') await engine.subtreeAdd(prefix, remote, branch);
      else if (action === 'pull') await engine.subtreePull(prefix, remote, branch);
      else if (action === 'push') await engine.subtreePush(prefix, remote, branch);
      
      spinner.succeed(chalk.green(`\n✔ Subtree ${action}ed successfully!`));
    } catch (e: any) {
      spinner.fail(chalk.red('Subtree operation failed.'));
      console.error(chalk.dim(e.message));
    }
  } catch (error: any) {
    console.error(chalk.red('\nSubtree command failed:'), error.message);
  }
}
