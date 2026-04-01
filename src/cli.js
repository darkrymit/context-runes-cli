#!/usr/bin/env node
import { Command } from 'commander';
import { configure as configureOutput } from './output.js';
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
  .version('1.0.5')
  .option('-y, --yes', 'assume yes to all prompts and skip interactive mode (also auto-detected in non-TTY environments)')
  .option('-p, --plain', 'plain output: no colors, no box-drawing, plain symbols — optimised for AI/pipe use');

program.hook('preAction', () => {
  configureOutput({ plain: !!program.opts().plain });
});

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
    await listHandler({ format: opts.format, plain: !!program.opts().plain, projectRoot: process.cwd() });
  });

program
  .command('validate')
  .description('Check that all registered enrichers exist and export generate()')
  .action(async () => {
    await validateHandler({ yes: !!program.opts().yes, projectRoot: process.cwd() });
  });

program
  .command('init')
  .description('Create .context-runes/config.json in the current project')
  .action(async () => {
    await initHandler({ yes: !!program.opts().yes, projectRoot: process.cwd() });
  });

program
  .command('create [key]')
  .description('Scaffold a new enricher and register it in config')
  .option('--format <format>', 'enricher output format: tree or markdown')
  .option('--path <path>', 'file path for the enricher (default: .context-runes/enrichers/<key>.js)')
  .option('--name <name>', 'human-readable label shown in crunes list')
  .option('--description <description>', 'short description of what context this enricher provides')
  .action(async (key, opts) => {
    await createHandler({ key, format: opts.format, path: opts.path, name: opts.name, description: opts.description, yes: !!program.opts().yes, projectRoot: process.cwd() });
  });

program.parse();
