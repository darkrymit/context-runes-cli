import chalk from 'chalk';

export const output = {
  header(label) {
    console.log(chalk.dim('─'.repeat(40)));
    console.log(chalk.bold(label));
  },
  success(msg) {
    console.log(`${chalk.green('✓')} ${msg}`);
  },
  error(msg) {
    console.error(`${chalk.red('✗')} ${msg}`);
  },
  warn(msg) {
    console.warn(`${chalk.yellow('⚠')} ${msg}`);
  },
  info(msg) {
    console.log(`${chalk.blue('ℹ')} ${msg}`);
  },
};
