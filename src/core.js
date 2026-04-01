import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createUtils } from './utils/index.js';

export function loadConfig(dir) {
  const configPath = join(dir, '.context-runes', 'config.json');
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

/**
 * Normalises a rune config entry to { path, name?, description? }.
 * Supports both legacy string format and object format.
 */
export function normaliseRune(entry) {
  if (typeof entry === 'string') return { path: entry };
  return entry;
}

/**
 * Returns the normalised entry for a key, or null if not found.
 */
export function getRune(config, key) {
  const raw = (config.runes ?? {})[key];
  if (raw == null) return null;
  return normaliseRune(raw);
}

/**
 * Runs a rune and returns a Section[] array.
 * Handles Shape A (single data object) and Shape B (Section[]) returns.
 * Returns null if key not in config.
 */
export async function runRune(dir, config, key, args) {
  const entry = getRune(config, key);
  if (!entry) return null;

  const fullPath = join(dir, entry.path);
  const rune = await import(pathToFileURL(fullPath).href);

  const generate = rune.generate ?? rune.default?.generate;

  if (typeof generate !== 'function') {
    throw new Error(`Rune "${key}" does not export a generate function`);
  }

  const utils = createUtils();
  const result = await generate(dir, args, utils);

  // Shape B — already a sections array
  if (Array.isArray(result)) return result;

  // Shape A — single data object, normalise to single-element array
  return [result];
}
