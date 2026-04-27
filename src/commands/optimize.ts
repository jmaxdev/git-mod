import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function optimizeCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n🛠️ Git-Mod Optimize: Maintenance Wizard'));
  console.log(chalk.dim('Keep your repository healthy and fast.\n'));

  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Which maintenance task would you like to run?',
        choices: [
          { name: '✨ Fast Cleanup (gc + prune)', value: 'fast' },
          { name: '🧹 Deep Maintenance (git maintenance)', value: 'deep' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    const spinner = ora('Running maintenance tasks... This may take a moment.').start();
    
    if (action === 'fast' || action === 'deep') {
      await engine.maintenanceRun();
      spinner.succeed(chalk.green('Repository optimized!'));
      console.log(chalk.dim('\nWhat was done:'));
      console.log(`${chalk.blue('•')} Compressed database objects (gc)`);
      console.log(`${chalk.blue('•')} Removed unreachable objects (prune)`);
      if (action === 'deep') {
        console.log(`${chalk.blue('•')} Scheduled background maintenance (if supported)`);
      }
    }
  } catch (error: any) {
    console.error(chalk.red('\nOptimization failed:'), error.message);
  }
}
