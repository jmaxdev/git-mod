import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TEMPLATES: Record<string, string> = {
  'Node.js': 'node_modules/\ndist/\n.npm/\n*.log\n.env\n.DS_Store',
  'Python': '__pycache__/\n*.py[cod]\n*$py.class\n.venv/\nenv/\nbuild/\ndist/',
  'Go': 'bin/\nobj/\n*.exe\n*.test\nvendor/',
  'Universal (Web)': 'node_modules/\n.DS_Store\nThumbs.db\n.env\n.vscode/\n.idea/',
};

export async function initCommand() {
  console.log(chalk.bold.cyan('\n🚀 Git-Mod Init: Smart Repository Setup'));

  // 1. Run git init only if needed
  if (!fs.existsSync('.git')) {
    const spinner = ora('Initializing git repository...').start();
    try {
      execSync('git init', { stdio: 'ignore' });
      spinner.succeed(chalk.green('Git repository initialized.'));
    } catch (error: any) {
      spinner.fail(chalk.red(`Failed to initialize git: ${error.message}`));
      return;
    }
  } else {
    console.log(chalk.dim('ℹ Repository already initialized, skipping git init.'));
  }

  // 2. Check for .gitignore
  if (fs.existsSync('.gitignore')) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: '.gitignore already exists. Do you want to append/overwrite it?',
        default: false
      }
    ]);
    if (!overwrite) return;
  }

  // 3. Select template
  const { templateType } = await inquirer.prompt([
    {
      type: 'list',
      name: 'templateType',
      message: 'Select a .gitignore template:',
      choices: [...Object.keys(TEMPLATES), 'Custom/None']
    }
  ]);

  if (templateType === 'Custom/None') return;

  let templateContent = TEMPLATES[templateType];

  // 4. Ask about lock files
  const { ignoreLocks } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ignoreLocks',
      message: 'Do you want to ignore lock files (package-lock.json, yarn.lock, etc.)?',
      default: false
    }
  ]);

  if (ignoreLocks) {
    templateContent += '\n# Lock files\npackage-lock.json\nyarn.lock\npnpm-lock.yaml\nbun.lockb\n*.lock\n*-lock';
  }
  
  try {
    fs.writeFileSync('.gitignore', templateContent + '\n', { flag: 'a' });
    console.log(chalk.green(`\n✅ Added ${templateType} template to .gitignore`));
  } catch (error: any) {
    console.error(chalk.red(`\n❌ Failed to write .gitignore: ${error.message}`));
  }
}
