import Table from 'cli-table3';
import { loadConfig } from '../core.js';
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

  if (format === 'json') {
    process.stdout.write(JSON.stringify(keys, null, 2) + '\n');
    return;
  }

  if (keys.length === 0) {
    process.stdout.write('No enrichers configured. Run `crunes create <key>` to add one.\n');
    return;
  }

  const table = new Table({
    head: ['Key', 'Path'],
    style: { head: ['cyan'] },
  });

  for (const key of keys) {
    table.push([key, enrichers[key]]);
  }

  process.stdout.write(table.toString() + '\n');
}
