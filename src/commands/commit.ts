import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { ConfigManager } from '../core/config-manager.ts';
import { updateChangelog } from '../utils/changelog-utils.ts';

export async function commitCommand() {
  const config = new ConfigManager();
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

    const { scope, subject, body, isBreaking, hasCoAuthors } = await inquirer.prompt([
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
      },
      {
        type: 'confirm',
        name: 'hasCoAuthors',
        message: 'Are there any co-authors for this commit?',
        default: (config.get('defaultCoAuthors') || []).length > 0
      }
    ]);

    let coAuthorStrings: string[] = [];
    if (hasCoAuthors) {
      const defaults = config.get('defaultCoAuthors') || [];
      if (defaults.length > 0) {
        const { useDefaults } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'useDefaults',
            message: `Use default co-authors? (${defaults.join(', ')})`,
            default: true
          }
        ]);
        if (useDefaults) {
          coAuthorStrings = [...defaults.map(a => `Co-authored-by: ${a}`)];
        }
      }

      if (coAuthorStrings.length === 0 || (await inquirer.prompt([{ type: 'confirm', name: 'addMore', message: 'Add more co-authors?', default: false }])).addMore) {
        let addingMore = true;
        while (addingMore) {
          const { name, email } = await inquirer.prompt([
            { type: 'input', name: 'name', message: 'Co-author name:', validate: (val) => !!val },
            { type: 'input', name: 'email', message: 'Co-author email:', validate: (val) => !!val }
          ]);
          coAuthorStrings.push(`Co-authored-by: ${name} <${email}>`);
          
          const { more } = await inquirer.prompt([
            { type: 'confirm', name: 'more', message: 'Add another co-author?', default: false }
          ]);
          addingMore = more;
        }
      }
    }

    let message = `${type}${scope ? `(${scope})` : ''}${isBreaking ? '!' : ''}: ${subject}`;
    if (body) {
      message += `\n\n${body}`;
    }
    if (isBreaking) {
      message += `\n\nBREAKING CHANGE: ${body || 'A major change was made.'}`;
    }
    if (coAuthorStrings.length > 0) {
      message += `\n\n${coAuthorStrings.join('\n')}`;
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

        // Handle auto-changelog
        let shouldUpdateChangelog = false;
        const autoChangelogCfg = config.get('autoChangelog') || 'ask';

        if (autoChangelogCfg === 'always') {
          shouldUpdateChangelog = true;
        } else if (autoChangelogCfg === 'ask') {
          const { res } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'res',
              message: 'Do you want to add this commit to CHANGELOG.md?',
              default: true
            }
          ]);
          shouldUpdateChangelog = res;
        }

        if (shouldUpdateChangelog) {
          const changelogSpinner = ora('Updating CHANGELOG.md...').start();
          try {
            const lastHash = execSync('git rev-parse --short HEAD').toString().trim();
            const pkgPath = path.join(process.cwd(), 'package.json');
            let version = 'Unreleased';
            if (fs.existsSync(pkgPath)) {
              version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
            }
            
            updateChangelog(version, message, lastHash);
            execSync('git add CHANGELOG.md');
            execSync('git commit --amend --no-edit');
            changelogSpinner.succeed(chalk.green('CHANGELOG.md updated and commit amended.'));
          } catch (e: any) {
            changelogSpinner.fail(chalk.red('Failed to update CHANGELOG.md.'));
            console.error(chalk.dim(e.message));
          }
        }

        let shouldPush = config.get('autoPush');
        if (shouldPush === undefined) {
          const res = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'shouldPush',
              message: 'Do you want to push these changes now?',
              default: true
            }
          ]);
          shouldPush = res.shouldPush;
        }

        if (shouldPush) {
          let shouldTag = config.get('tagAfterCommit');
          let versionTag = '';

          if (shouldTag !== false) {
            const pkgPath = path.join(process.cwd(), 'package.json');
            if (fs.existsSync(pkgPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                const pkgVersion = `v${pkg.version}`;
                const res = await inquirer.prompt([
                  {
                    type: 'confirm',
                    name: 'shouldTag',
                    message: `Create and push tag ${chalk.cyan(pkgVersion)} for this commit?`,
                    default: !!config.get('tagAfterCommit')
                  }
                ]);
                if (res.shouldTag) {
                  shouldTag = true;
                  versionTag = pkgVersion;
                } else {
                  shouldTag = false;
                }
              } catch (e) {}
            }
          }

          const pushSpinner = ora('Pushing to remote...').start();
          try {
            if (shouldTag && versionTag) {
              execSync(`git tag -a ${versionTag} -m "Release ${versionTag}"`, { stdio: 'pipe' });
              execSync('git push --follow-tags', { stdio: 'pipe' });
              pushSpinner.succeed(chalk.green(`Pushed successfully with tag ${versionTag}!`));
            } else {
              execSync('git push', { stdio: 'pipe' });
              pushSpinner.succeed(chalk.green('Pushed successfully!'));
            }
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
