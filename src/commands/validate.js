import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import chalk from 'chalk';
import { loadConfig } from '../core.js';
import { output } from '../output.js';

export async function handler({
  nonInteractive = false,
  projectRoot = process.cwd(),
} = {}) {
  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (err) {
    output.error(`Config unreadable: ${err.message}`);
    process.exit(1);
  }

  const enrichers = config.enrichers ?? {};
  const keys = Object.keys(enrichers);

  if (keys.length === 0) {
    output.info('No enrichers registered. Add some with `crunes create <key>`.');
    return;
  }

  let allPassed = true;

  for (const key of keys) {
    const relPath = enrichers[key];
    const fullPath = join(projectRoot, relPath);

    if (!existsSync(fullPath)) {
      console.log(`${chalk.red('✗')} ${chalk.bold(key)} — file not found: ${relPath}`);
      allPassed = false;
      continue;
    }

    let enricher;
    try {
      enricher = await import(pathToFileURL(fullPath).href);
    } catch (err) {
      console.log(`${chalk.red('✗')} ${chalk.bold(key)} — import error: ${err.message}`);
      allPassed = false;
      continue;
    }

    const generate = enricher.generate ?? enricher.default?.generate;
    if (typeof generate !== 'function') {
      console.log(`${chalk.red('✗')} ${chalk.bold(key)} — missing export: generate()`);
      allPassed = false;
      continue;
    }

    const sectionTag = enricher.sectionTag ?? enricher.default?.sectionTag;
    const tagNote = sectionTag
      ? chalk.dim(` (tag: ${sectionTag})`)
      : chalk.dim(' (no sectionTag, defaults to key)');
    console.log(`${chalk.green('✓')} ${chalk.bold(key)}${tagNote}`);
  }

  if (!allPassed) {
    process.exit(1);
  }
}
