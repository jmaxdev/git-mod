import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { GitEngine } from '../core/git-engine.ts';
import { updateChangelog } from '../utils/changelog-utils.ts';

export async function changelogCommand() {
  const engine = new GitEngine();
  console.log(chalk.bold.cyan('\n📝 Git-Mod Changelog Generator'));

  try {
    const spinner = ora('Reading git history...').start();
    const latestTag = await engine.getLatestTag();
    const commits = await engine.getCommitsSinceLastTag();
    spinner.stop();

    if (commits.length === 0) {
      console.log(chalk.yellow(`No new commits found since the last tag (${latestTag || 'beginning of time'}).`));
      return;
    }

    console.log(chalk.dim(`Found ${commits.length} commits since ${latestTag || 'the beginning'}.`));

    const { version } = await inquirer.prompt([
      {
        type: 'input',
        name: 'version',
        message: `What is the new version number? (Current: ${latestTag || 'None'})`,
        validate: (input) => input.length > 0 || 'Version is required.',
        filter: (val) => val.trim().startsWith('v') ? val.trim() : `v${val.trim()}`
      }
    ]);

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Generate entry for version ${version} based on ${commits.length} commits?`,
        default: true
      }
    ]);

    if (confirm) {
      const changelogSpinner = ora('Updating CHANGELOG.md...').start();
      try {
        // Sort commits so they appear in a logical order (optional, but good)
        // Here we just process them. updateChangelog handles the sections.
        for (const commit of commits.reverse()) {
          const isMerge = commit.message.startsWith('Merge branch') || commit.message.startsWith('Merge pull request');
          if (isMerge) continue;
          
          updateChangelog(version.replace(/^v/, ''), commit.message, commit.hash);
        }
        changelogSpinner.succeed(chalk.green('\n✔ CHANGELOG.md updated.'));

        const tagSpinner = ora(`Creating Git Tag ${version}...`).start();
        try {
          await engine.createVersionTag(version, `Release ${version}`);
          tagSpinner.succeed(chalk.green(`✔ Git Tag ${version} created!`));
          
          console.log(chalk.yellow('\nTip: Run "git add CHANGELOG.md", commit, and then "git push --follow-tags"'));
        } catch (e: any) {
          tagSpinner.fail(chalk.red(`Failed to create tag: ${e.message}`));
        }
      } catch (e: any) {
        changelogSpinner.fail(chalk.red('Failed to update CHANGELOG.md.'));
        console.error(chalk.dim(e.message));
      }
    }

  } catch (error: any) {
    console.error(chalk.red('\nChangelog command failed:'), error.message);
  }
}
