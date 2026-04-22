import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { GitEngine } from '../core/git-engine.ts';

export async function huntCommand() {
  const engine = new GitEngine();
  
  console.log(chalk.bold.cyan('\n🏹 Git-Mod Hunt: Bug Hunter Wizard'));
  console.log(chalk.dim('Let\'s find the commit that introduced the bug.\n'));

  try {
    const commits = await engine.getRecentCommits(30);
    
    const { badHash } = await inquirer.prompt([
      {
        type: 'list',
        name: 'badHash',
        message: 'Select the "BAD" commit (usually current HEAD):',
        choices: [
          { name: 'Current HEAD', value: 'HEAD' },
          ...commits.map(c => ({ name: `${chalk.red(c.hash.substring(0, 7))} - ${c.message}`, value: c.hash }))
        ]
      }
    ]);

    const { goodHash } = await inquirer.prompt([
      {
        type: 'list',
        name: 'goodHash',
        message: 'Select a "GOOD" commit (where it used to work):',
        choices: commits.map(c => ({ 
          name: `${chalk.green(c.hash.substring(0, 7))} - ${c.message}`, 
          value: c.hash 
        }))
      }
    ]);

    const spinner = ora('Initializing bisect...').start();
    await engine.startBisect(badHash, goodHash);
    spinner.succeed(chalk.green('Bisect started. Let the hunt begin!'));

    let finished = false;
    while (!finished) {
      const { status } = await inquirer.prompt([
        {
          type: 'list',
          name: 'status',
          message: 'Is this commit good or bad?',
          choices: [
            { name: chalk.green('✔ Good (Bug is NOT here)'), value: 'good' },
            { name: chalk.red('✘ Bad (Bug IS here)'), value: 'bad' },
            { name: chalk.yellow('⏩ Skip'), value: 'skip' },
            { name: 'Abort', value: 'abort' }
          ]
        }
      ]);

      if (status === 'abort') {
        await engine.resetBisect();
        console.log(chalk.yellow('Hunt aborted.'));
        return;
      }

      const output = await engine.bisectStep(status as 'good' | 'bad' | 'skip');
      
      if (output.includes('is the first bad commit')) {
        console.log('\n' + chalk.bold.bgRed(' 🏁 CULPRIT FOUND! '));
        console.log(output);
        finished = true;
        await engine.resetBisect();
        console.log(chalk.dim('\nBisect reset. You are back on your original branch.'));
      } else {
        console.log('\n' + chalk.cyan(output));
      }
    }
  } catch (error: any) {
    console.error(chalk.red('Hunt failed:'), error.message);
    await engine.resetBisect().catch(() => {});
  }
}
