import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { execSync } from 'child_process';

export async function commitCommand() {
  console.log(chalk.bold.cyan('\n✍️ Git-Mod Commit: Conventional Wizard'));

  const types = [
    { name: '✨ feat:     A new feature', value: 'feat' },
    { name: '🐛 fix:      A bug fix', value: 'fix' },
    { name: '📝 docs:     Documentation only changes', value: 'docs' },
    { name: '💄 style:    Changes that do not affect the meaning of the code', value: 'style' },
    { name: '♻️  refactor: A code change that neither fixes a bug nor adds a feature', value: 'refactor' },
    { name: '⚡️ perf:     A code change that improves performance', value: 'perf' },
    { name: '✅ test:     Adding missing tests or correcting existing tests', value: 'test' },
    { name: '👷 build:    Changes that affect the build system or external dependencies', value: 'build' },
    { name: '🔧 chore:    Other changes that don\'t modify src or test files', value: 'chore' },
    { name: '⏪ revert:   Reverts a previous commit', value: 'revert' },
    { name: '🚪 Exit', value: 'exit' }
  ];

  try {
    const { shouldAdd } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldAdd',
        message: 'Do you want to stage all changes (git add .) first?',
        default: true
      }
    ]);

    if (shouldAdd) {
      const addSpinner = ora('Staging changes...').start();
      try {
        execSync('git add .');
        addSpinner.succeed(chalk.green('All changes staged.'));
      } catch (e: any) {
        addSpinner.fail(chalk.red('Failed to stage changes.'));
        console.error(chalk.dim(e.message));
      }
    }

    const { type } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Select the type of change that you\'re committing:',
        choices: types
      }
    ]);

    if (type === 'exit') return;

    const { scope, subject, body, isBreaking } = await inquirer.prompt([
      {
        type: 'input',
        name: 'scope',
        message: 'What is the scope of this change (e.g. component or file name): (press enter to skip)',
        filter: (val) => val.trim()
      },
      {
        type: 'input',
        name: 'subject',
        message: 'Write a short, imperative lowercase description of the change:',
        validate: (input) => input.length > 0 || 'Subject is required.',
        filter: (val) => val.trim()
      },
      {
        type: 'input',
        name: 'body',
        message: 'Provide a longer description of the change: (press enter to skip)',
        filter: (val) => val.trim()
      },
      {
        type: 'confirm',
        name: 'isBreaking',
        message: 'Are there any breaking changes?',
        default: false
      }
    ]);

    let message = `${type}${scope ? `(${scope})` : ''}${isBreaking ? '!' : ''}: ${subject}`;
    if (body) {
      message += `\n\n${body}`;
    }
    if (isBreaking) {
      message += `\n\nBREAKING CHANGE: ${body || 'A major change was made.'}`;
    }

    console.log(chalk.bold('\nGenerated Commit Message:'));
    console.log(chalk.gray('--------------------------------------------------'));
    console.log(chalk.white(message));
    console.log(chalk.gray('--------------------------------------------------'));

    const { confirmAction } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmAction',
        message: 'Proceed with this commit?',
        default: true
      }
    ]);

    if (confirmAction) {
      const spinner = ora('Committing changes...').start();
      try {
        execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
        spinner.succeed(chalk.green('Changes committed successfully!'));

        const { shouldPush } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'shouldPush',
            message: 'Do you want to push these changes now?',
            default: true
          }
        ]);

        if (shouldPush) {
          const pushSpinner = ora('Pushing to remote...').start();
          try {
            execSync('git push', { stdio: 'pipe' });
            pushSpinner.succeed(chalk.green('Pushed successfully!'));
          } catch (e: any) {
            pushSpinner.fail(chalk.red('Push failed.'));
            console.error(chalk.dim(e.stderr?.toString() || e.message));
          }
        }
      } catch (e: any) {
        spinner.fail(chalk.red('Commit failed.'));
        console.error(chalk.dim(e.stderr?.toString() || e.message));
      }
    }
  } catch (error: any) {
    console.error(chalk.red('\nCommit wizard failed:'), error.message);
  }
}
