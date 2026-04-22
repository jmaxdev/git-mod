import chalk from 'chalk';
import boxen from 'boxen';

export const logger = {
  brand: () => {
    console.log(
      boxen(chalk.bold.magenta('GIT-MOD') + chalk.dim(' v0.1.0'), {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'magenta',
        title: 'The Git Supercharger',
        titleAlignment: 'center'
      })
    );
  },
  error: (message: string) => {
    console.error(chalk.red.bold('✖ Error:'), chalk.red(message));
  },
  success: (message: string) => {
    console.log(chalk.green.bold('✔'), chalk.green(message));
  },
  info: (message: string) => {
    console.log(chalk.blue.bold('ℹ'), chalk.blue(message));
  }
};
