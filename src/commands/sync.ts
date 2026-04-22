import { simpleGit, SimpleGit } from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import { handleError } from '../utils/error-handler.ts';

interface SyncOptions {
  prune: boolean;
  rebase: boolean;
}

export async function syncCommand(options: SyncOptions) {
  const git: SimpleGit = simpleGit();
  const spinner = ora('Starting super-sync...').start();

  try {
    // 1. Fetch & Prune
    if (options.prune) {
      spinner.text = 'Fetching and pruning remote branches...';
      await git.fetch(['--prune', '--all']);
      spinner.succeed(chalk.green('Fetched and pruned remotes.'));
    } else {
      spinner.text = 'Fetching from remotes...';
      await git.fetch(['--all']);
      spinner.succeed(chalk.green('Fetched from remotes.'));
    }

    // 2. Rebase current branch
    if (options.rebase) {
      spinner.start('Rebasing current branch...');
      try {
        const status = await git.status();
        const currentBranch = status.current;
        
        if (currentBranch) {
          // Check if there's a tracking branch
          const remoteBranch = await git.revparse(['--abbrev-ref', '@{u}']).catch(() => null);
          
          if (remoteBranch) {
            await git.rebase([remoteBranch]);
            spinner.succeed(chalk.green(`Successfully rebased ${currentBranch} onto ${remoteBranch}.`));
          } else {
            spinner.info(chalk.yellow(`Skipping rebase: No upstream branch for ${currentBranch}.`));
          }
        }
      } catch (error: any) {
        spinner.fail(chalk.red('Rebase failed. You might have conflicts or no upstream.'));
        console.error(chalk.dim(error.message));
        return;
      }
    }

    // 3. Update submodules
    spinner.start('Updating submodules...');
    await git.subModule(['update', '--init', '--recursive']);
    spinner.succeed(chalk.green('Submodules updated.'));

    console.log('\n' + chalk.bold.cyan('✨ Super-sync complete! Your repo is up to date.'));
  } catch (error: any) {
    spinner.fail(chalk.red('Sync failed.'));
    handleError(error);
  }
}
