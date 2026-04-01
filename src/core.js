import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createUtils } from './utils/index.js';

export function loadConfig(dir) {
  const configPath = join(dir, '.context-runes', 'config.json');
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

/**
 * Normalises an enricher config entry to { path, name?, description? }.
 * Supports both legacy string format and object format.
 */
export function normaliseEnricherEntry(entry) {
  if (typeof entry === 'string') return { path: entry };
  return entry;
}

/**
 * Returns the normalised entry for a key, or null if not found.
 */
export function getEnricherEntry(config, key) {
  const raw = (config.enrichers ?? {})[key];
  if (raw == null) return null;
  return normaliseEnricherEntry(raw);
}

/**
 * Runs an enricher and returns a Section[] array.
 * Handles Shape A (single data object) and Shape B (Section[]) returns.
 * Returns null if key not in config.
 */
export async function runEnricher(dir, config, key, args) {
  const entry = getEnricherEntry(config, key);
  if (!entry) return null;

  const fullPath = join(dir, entry.path);
  const enricher = await import(pathToFileURL(fullPath).href);

  const generate = enricher.generate ?? enricher.default?.generate;

  if (typeof generate !== 'function') {
    throw new Error(`Enricher "${key}" does not export a generate function`);
  }

  const utils = createUtils();
  const result = await generate(dir, args, utils);

  // Shape B — already a sections array
  if (Array.isArray(result)) return result;

  // Shape A — single data object, normalise to single-element array
  return [result];
}
