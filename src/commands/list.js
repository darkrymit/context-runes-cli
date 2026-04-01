import Table from 'cli-table3';
import { loadConfig, getEnricherEntry } from '../core.js';
import { output } from '../output.js';

export async function handler({
  format = 'md',
  projectRoot = process.cwd(),
} = {}) {
  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (err) {
    output.error(`Config unreadable: ${err.message}`);
    output.info('Run `crunes init` to create a config file.');
    process.exit(1);
  }

  const enrichers = config.enrichers ?? {};
  const keys = Object.keys(enrichers);

  if (keys.length === 0) {
    process.stdout.write('No enrichers configured. Run `crunes create <key>` to add one.\n');
    return;
  }

  const entries = keys.map(key => {
    const entry = getEnricherEntry(config, key);
    return { key, path: entry.path, name: entry.name ?? null, description: entry.description ?? null };
  });

  if (format === 'json') {
    process.stdout.write(JSON.stringify(entries, null, 2) + '\n');
    return;
  }

  const table = new Table({
    head: ['Key', 'Name', 'Description', 'Path'],
    style: { head: ['cyan'] },
  });

  for (const { key, name, description, path } of entries) {
    table.push([key, name ?? '', description ?? '', path]);
  }

  process.stdout.write(table.toString() + '\n');
}
