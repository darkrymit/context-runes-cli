import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig, getRune } from '../core.js';
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

  const runes = config.runes ?? {};
  const keys = Object.keys(runes);

  if (keys.length === 0) {
    output.info('No runes registered. Add some with `crunes create <key>`.');
    return;
  }

  let allPassed = true;

  for (const key of keys) {
    const entry = getRune(config, key);
    const fullPath = join(projectRoot, entry.path);

    if (!existsSync(fullPath)) {
      output.error(`${key} — file not found: ${entry.path}`);
      allPassed = false;
      continue;
    }

    let rune;
    try {
      rune = await import(pathToFileURL(fullPath).href);
    } catch (err) {
      output.error(`${key} — import error: ${err.message}`);
      allPassed = false;
      continue;
    }

    const generate = rune.generate ?? rune.default?.generate;
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
