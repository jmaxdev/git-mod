import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { GitEngine } from '../core/git-engine.ts';

export async function sparseCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n📐 Git-Mod Sparse: Working Directory Architect'));
  console.log(chalk.dim('Manage sparse-checkout to optimize work in large repositories.\n'));

  try {
    const currentPatterns = await engine.sparseCheckoutList();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: `📋 List current patterns (${currentPatterns.length || 'Full Repo'})`, value: 'list' },
          { name: '✨ Initialize/Set sparse patterns', value: 'set' },
          { name: '🔄 Reset to Full Repository', value: 'reset' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    if (action === 'list') {
      if (currentPatterns.length === 0) {
        console.log(chalk.yellow('\nRepository is currently in full-checkout mode (no sparse patterns).'));
      } else {
        console.log(chalk.bold('\nActive Sparse Patterns:'));
        currentPatterns.forEach(p => console.log(`${chalk.green('•')} ${p}`));
      }
    } else if (action === 'set') {
      // Get directories in the current folder to suggest
      const dirs = fs.readdirSync(process.cwd(), { withFileTypes: true })
        .filter(d => d.isDirectory() && !d.name.startsWith('.'))
        .map(d => d.name);

      const { patterns } = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'patterns',
          message: 'Select directories to keep (Space to select, Enter to confirm):',
          choices: dirs.map(d => ({ name: d, value: d, checked: currentPatterns.includes(d) }))
        }
      ]);

      if (patterns.length === 0) {
        console.log(chalk.yellow('\nNo directories selected. Use "Reset" to go back to full repo or select at least one.'));
        return;
      }

      const spinner = ora('Configuring sparse-checkout...').start();
      await engine.sparseCheckoutSet(patterns);
      spinner.succeed(chalk.green('\nSparse-checkout updated! Only selected directories are now visible.'));
      console.log(chalk.dim('Tip: Git still tracks everything, but your disk only holds what you selected.'));
    } else if (action === 'reset') {
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: chalk.yellow('This will restore all files in the repository. Continue?'),
          default: true
        }
      ]);

      if (confirm) {
        const spinner = ora('Resetting to full repository...').start();
        await engine.sparseCheckoutSet(['/*']); // Set to everything
        // Technically 'git sparse-checkout disable' is better but simple-git raw is easier this way
        spinner.succeed(chalk.green('Repository restored to full-checkout mode.'));
      }
    }
  } catch (error: any) {
    console.error(chalk.red('\nSparse operation failed:'), error.message);
  }
}
