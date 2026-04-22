import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function restoreCommand() {
  const engine = new GitEngine();
  const spinner = ora('Checking for changed files...').start();

  try {
    const git = (engine as any).git;
    const status = await git.status();
    spinner.stop();

    // Files that can be restored (modified, deleted, but not untracked by default for simple restore)
    const restorableFiles = [
      ...status.modified.map((f: string) => ({ name: f, type: 'modified' })),
      ...status.deleted.map((f: string) => ({ name: f, type: 'deleted' })),
      ...status.renamed.map((f: any) => ({ name: f.to, type: 'renamed' }))
    ];

    if (restorableFiles.length === 0) {
      console.log(chalk.green('✔ No modified files found to restore.'));
      return;
    }

    const { selectedFiles } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedFiles',
        message: 'Select files to restore (discard changes):',
        choices: restorableFiles.map(f => ({
          name: `${chalk.yellow(f.name)} ${chalk.dim(`(${f.type})`)}`,
          value: f.name
        }))
      }
    ]);

    if (selectedFiles.length === 0) {
      console.log(chalk.yellow('No files selected.'));
      return;
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.red(`Are you sure you want to discard changes in ${selectedFiles.length} files?`),
        default: false
      }
    ]);

    if (confirm) {
      const restoreSpinner = ora('Restoring files...').start();
      await git.raw(['restore', ...selectedFiles]);
      restoreSpinner.succeed(chalk.green(`Successfully restored ${selectedFiles.length} files.`));
    }
  } catch (error: any) {
    spinner.stop();
    console.error(chalk.red('\n✖ Restore failed:'), error.message);
  }
}
