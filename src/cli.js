#!/usr/bin/env node
import { Command } from 'commander';
import { handler as queryHandler } from './commands/query.js';
import { handler as runHandler } from './commands/run.js';
import { handler as listHandler } from './commands/list.js';
import { handler as validateHandler } from './commands/validate.js';
import { handler as initHandler } from './commands/init.js';
import { handler as createHandler } from './commands/create.js';

const program = new Command();

program
  .name('crunes')
  .description('CLI tool for querying context-runes enrichers')
  .version('1.0.0')
  .option('-n, --no-interactive', 'disable interactive prompts (also auto-detected in non-TTY environments)');

program
  .command('query <key> [args...]')
  .description('Query an enricher and print its output')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (key, args, opts) => {
    await queryHandler({ key, args, format: opts.format, projectRoot: process.cwd() });
  });

program
  .command('run <key> [args...]')
  .description('Query an enricher — alias for query --format md')
  .action(async (key, args) => {
    await runHandler({ key, args, projectRoot: process.cwd() });
  });

program
  .command('list')
  .description('List all registered enricher keys')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (opts) => {
    await listHandler({ format: opts.format, projectRoot: process.cwd() });
  });

program
  .command('validate')
  .description('Check that all registered enrichers exist and export generate()')
  .action(async () => {
    await validateHandler({ nonInteractive: !program.opts().interactive, projectRoot: process.cwd() });
  });

program
  .command('init')
  .description('Create .context-runes/config.json in the current project')
  .option('-y, --yes', 'overwrite existing config without confirmation')
  .action(async (opts) => {
    await initHandler({ yes: opts.yes ?? false, nonInteractive: !program.opts().interactive, projectRoot: process.cwd() });
  });

program
  .command('create [key]')
  .description('Scaffold a new enricher and register it in config')
  .option('--format <format>', 'enricher output format: tree or markdown')
  .option('--path <path>', 'file path for the enricher (default: .context-runes/enrichers/<key>.js)')
  .action(async (key, opts) => {
    await createHandler({ key, format: opts.format, path: opts.path, nonInteractive: !program.opts().interactive, projectRoot: process.cwd() });
  });

program.parse();
