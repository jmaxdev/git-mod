import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../core/config-manager.ts';

export async function configCommand() {
  const config = new ConfigManager();
  console.log(chalk.bold.cyan('\n⚙️ Git-Mod Configuration'));

  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What do you want to configure?',
        choices: [
          { name: 'Toggle Auto-Push after commit', value: 'autoPush' },
          { name: 'Toggle Tagging after commit', value: 'tagAfterCommit' },
          { name: 'Toggle Identity Auto-Switch', value: 'autoSwitch' },
          { name: 'Change Auto-Changelog behavior', value: 'autoChangelog' },
          { name: 'Manage Default Co-Authors', value: 'coauthors' },
          { name: 'Exit', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') return;

    if (action === 'coauthors') {
      const current = config.get('defaultCoAuthors') || [];
      const { newAuthors } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newAuthors',
          message: 'Enter co-authors (Name <email>), comma separated:',
          default: current.join(', ')
        }
      ]);
      config.set('defaultCoAuthors', newAuthors.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0));
      console.log(chalk.green('✔ Default co-authors updated.'));
    } else if (action === 'autoChangelog') {
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'When should Git-Mod update CHANGELOG.md during commit?',
          choices: [
            { name: 'Always (Automatic)', value: 'always' },
            { name: 'Never', value: 'never' },
            { name: 'Ask me every time', value: 'ask' }
          ],
          default: config.get('autoChangelog') || 'ask'
        }
      ]);
      config.set('autoChangelog', choice);
      console.log(chalk.green(`✔ Auto-Changelog behavior set to: ${choice.toUpperCase()}`));
    } else {
      const current = !!config.get(action as any);
      config.set(action as any, !current);
      console.log(chalk.green(`✔ ${action} is now ${!current ? 'ENABLED' : 'DISABLED'}.`));
    }
  } catch (error: any) {
    console.error(chalk.red('\nConfig command failed:'), error.message);
  }
}
