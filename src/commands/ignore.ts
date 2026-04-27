import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export async function ignoreCommand(targetPath?: string) {
  console.log(chalk.bold.cyan('\n🙈 Git-Mod Ignore: The Oops Fixer'));

  try {
    let fileToIgnore = targetPath;

    if (!fileToIgnore) {
      const { inputPath } = await inquirer.prompt([
        {
          type: 'input',
          name: 'inputPath',
          message: 'What file or folder do you want to untrack and ignore? (e.g. .env, node_modules/)',
          validate: (val) => val.trim().length > 0 || 'You must provide a path.'
        }
      ]);
      fileToIgnore = inputPath.trim();
    }

    if (!fileToIgnore) return;

    // 1. Add to .gitignore
    const gitignorePath = path.join(process.cwd(), '.gitignore');
    let ignoreExists = false;
    
    if (fs.existsSync(gitignorePath)) {
      const content = fs.readFileSync(gitignorePath, 'utf8');
      const lines = content.split('\n').map(l => l.trim());
      if (lines.includes(fileToIgnore)) {
        ignoreExists = true;
      }
    }

    if (!ignoreExists) {
      const { shouldIgnore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'shouldIgnore',
          message: `Do you want to add '${fileToIgnore}' to .gitignore?`,
          default: true
        }
      ]);

      if (shouldIgnore) {
        fs.appendFileSync(gitignorePath, `\n${fileToIgnore}\n`);
        console.log(chalk.green(`\n✔ Added '${fileToIgnore}' to .gitignore`));
      }
    } else {
      console.log(chalk.yellow(`\nℹ '${fileToIgnore}' is already in .gitignore`));
    }

    // 2. Untrack from git
    const rmSpinner = ora(`Removing '${fileToIgnore}' from Git tracking...`).start();
    try {
      execSync(`git rm -r --cached "${fileToIgnore}"`, { stdio: 'pipe' });
      rmSpinner.succeed(chalk.green(`✔ Successfully untracked '${fileToIgnore}'. (Your local files are safe!)`));
    } catch (e: any) {
      const errorMessage = e.stderr?.toString() || e.message;
      if (errorMessage.includes('did not match any files')) {
        rmSpinner.info(chalk.yellow(`ℹ '${fileToIgnore}' wasn't being tracked by Git anyway.`));
      } else {
        rmSpinner.fail(chalk.red(`Failed to untrack: ${errorMessage}`));
      }
    }

    // 3. Offer to amend
    const { shouldAmend } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldAmend',
        message: 'Did you just commit this by accident? Want to amend the last commit to erase the evidence?',
        default: false
      }
    ]);

    if (shouldAmend) {
      const amendSpinner = ora('Amending last commit...').start();
      try {
        execSync('git add .gitignore', { stdio: 'pipe' });
        execSync('git commit --amend --no-edit', { stdio: 'pipe' });
        amendSpinner.succeed(chalk.green('✔ Last commit amended! Evidence destroyed. 🕵️‍♂️'));
        
        console.log(chalk.yellow('\n⚠️  If you already pushed the mistake, you will need to run:'));
        console.log(chalk.cyan('   git push --force'));
      } catch (e: any) {
        amendSpinner.fail(chalk.red('Failed to amend commit.'));
        console.error(chalk.dim(e.stderr?.toString() || e.message));
      }
    } else {
      console.log(chalk.cyan('\nTip: Don\'t forget to commit the changes to your .gitignore!'));
    }

  } catch (error: any) {
    console.error(chalk.red('\nIgnore command failed:'), error.message);
  }
}
