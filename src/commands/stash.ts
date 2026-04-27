import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function stashCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n📦 Git-Mod Stash: Storage Wizard'));

  try {
    const stashes = await engine.getStashes();
    
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: `📋 List & Manage stashes (${stashes.length})`, value: 'manage' },
          { name: '➕ Create new stash', value: 'push' },
          { name: '🚪 Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    if (action === 'push') {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: 'Stash message:',
          default: `Stashed by Git-Mod on ${new Date().toLocaleString()}`
        }
      ]);

      const spinner = ora('Saving changes to stash...').start();
      await engine.createStash(message);
      spinner.succeed(chalk.green('Changes stashed successfully!'));
    } else if (action === 'manage') {
      if (stashes.length === 0) {
        console.log(chalk.yellow('\nNo stashes found.'));
        return;
      }

      const { stashIndex } = await inquirer.prompt([
        {
          type: 'list',
          name: 'stashIndex',
          message: 'Select a stash to act upon:',
          choices: stashes.map(s => ({
            name: `${chalk.yellow(s.id)}: ${s.message} ${chalk.dim(`(${s.date})`)}`,
            value: s.index
          }))
        }
      ]);

      const selected = stashes.find(s => s.index === stashIndex)!;

      const { subAction } = await inquirer.prompt([
        {
          type: 'list',
          name: 'subAction',
          message: `Action for ${selected.id}:`,
          choices: [
            { name: 'Apply (keep stash)', value: 'apply' },
            { name: 'Pop (apply and remove)', value: 'pop' },
            { name: 'Drop (remove without applying)', value: 'drop' },
            { name: 'Cancel', value: 'cancel' }
          ]
        }
      ]);

      if (subAction === 'cancel') return;

      const spinner = ora(`${subAction === 'drop' ? 'Dropping' : 'Applying'} stash...`).start();
      await engine.stashAction(stashIndex, subAction as any);
      spinner.succeed(chalk.green(`Stash ${selected.id} ${subAction}ed successfully!`));
    }
  } catch (error: any) {
    console.error(chalk.red('\nStash operation failed:'), error.message);
  }
}
