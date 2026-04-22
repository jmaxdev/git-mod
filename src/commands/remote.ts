import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';
import { profileCommand } from './profile.ts';

export async function remoteCommand() {
  const engine = new GitEngine();
  
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Remote Management:',
      choices: [
        { name: '📋 List remotes', value: 'list' },
        { name: '➕ Add new remote', value: 'add' },
        { name: '❌ Remove remote', value: 'remove' },
        { name: '🚪 Exit', value: 'exit' }
      ]
    }
  ]);

  switch (action) {
    case 'list':
      await listRemotes(engine);
      break;
    case 'add':
      await addRemote(engine);
      break;
    case 'remove':
      await removeRemote(engine);
      break;
  }
}

async function listRemotes(engine: GitEngine) {
  const git = (engine as any).git;
  const remotes = await git.getRemotes(true);
  
  if (remotes.length === 0) {
    console.log(chalk.yellow('\nNo remotes configured.'));
    return;
  }

  console.log(chalk.bold.cyan('\nConfigured Remotes:'));
  remotes.forEach((r: any) => {
    console.log(`${chalk.bold(r.name)}:`);
    console.log(chalk.dim(`  fetch: ${r.refs.fetch}`));
    console.log(chalk.dim(`  push:  ${r.refs.push}`));
  });
}

async function addRemote(engine: GitEngine) {
  const { name, url } = await inquirer.prompt([
    { type: 'input', name: 'name', message: 'Remote name:', default: 'origin', filter: val => val.trim() },
    { type: 'input', name: 'url', message: 'Remote URL (e.g., git@github.com:user/repo.git):', validate: i => !!i, filter: val => val.trim() }
  ]);

  const spinner = ora(`Adding remote ${name}...`).start();
  try {
    const git = (engine as any).git;
    await git.addRemote(name, url);
    spinner.succeed(chalk.green(`Remote '${name}' added.`));

    const { configureProfile } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureProfile',
        message: 'Do you want to apply an identity profile to this repo now?',
        default: true
      }
    ]);

    if (configureProfile) {
      // We can reuse the profileCommand or just call its internal 'use' logic
      // For simplicity, let's just trigger the main profile menu
      console.log(chalk.cyan('\nOpening Profile Manager...'));
      await profileCommand();
    }
  } catch (error: any) {
    spinner.fail(chalk.red(`Failed to add remote: ${error.message}`));
  }
}

async function removeRemote(engine: GitEngine) {
  const git = (engine as any).git;
  const remotes = await git.getRemotes();
  
  if (remotes.length === 0) {
    console.log(chalk.yellow('\nNo remotes to remove.'));
    return;
  }

  const { toRemove } = await inquirer.prompt([
    {
      type: 'list',
      name: 'toRemove',
      message: 'Select remote to remove:',
      choices: remotes.map((r: any) => r.name)
    }
  ]);

  const { confirm } = await inquirer.prompt([
    { type: 'confirm', name: 'confirm', message: `Are you sure you want to remove remote '${toRemove}'?`, default: false }
  ]);

  if (confirm) {
    await git.removeRemote(toRemove);
    console.log(chalk.green(`Remote '${toRemove}' removed.`));
  }
}
