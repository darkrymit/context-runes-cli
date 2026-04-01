import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, getEnricherEntry } from '../core.js';
import { output } from '../output.js';

export async function handler({
  yes = false,
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
    const entry = getEnricherEntry(config, key);
    const fullPath = join(projectRoot, entry.path);

    if (!existsSync(fullPath)) {
      output.error(`${key} — file not found: ${entry.path}`);
      allPassed = false;
      continue;
    }

    let enricher;
    try {
      enricher = await import(pathToFileURL(fullPath).href);
    } catch (err) {
      output.error(`${key} — import error: ${err.message}`);
      allPassed = false;
      continue;
    }

    const generate = enricher.generate ?? enricher.default?.generate;
    if (typeof generate !== 'function') {
      output.error(`${key} — missing export: generate()`);
      allPassed = false;
      continue;
    }

    output.success(key);
  }

  if (!allPassed) {
    process.exit(1);
  }
}
