import chalk from 'chalk';

export function suggestFix(error: string) {
  if (error.includes('not a git repository')) {
    return `Try running ${chalk.cyan('git init')} first.`;
  }
  if (error.includes('no upstream branch')) {
    return `Try setting an upstream with ${chalk.cyan('git push -u origin <branch>')}.`;
  }
  if (error.includes('diverged')) {
    return `Your branches have diverged. Use ${chalk.cyan('git mod sync')} to rebase.`;
  }
  if (error.includes('conflict')) {
    return `Merge conflicts detected. Fix them or use ${chalk.cyan('git mod rescue')} to undo the last action.`;
  }
  if (error.includes('worktree')) {
    return `Worktree error. Use ${chalk.cyan('git mod switch')} to manage your worktrees.`;
  }
  return 'Check your git status and try again.';
}

export function handleError(error: any) {
  console.error('\n' + chalk.red.bold('✖ Git Error Detected'));
  console.error(chalk.red(error.message || error));
  console.log('\n' + chalk.yellow.bold('💡 Suggestion:'));
  console.log(suggestFix(error.message || ''));
}
