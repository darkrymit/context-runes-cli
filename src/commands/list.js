import Table from 'cli-table3';
import { loadConfig, getRune } from '../core.js';
import { output } from '../output.js';

export async function handler({
  format = 'md',
  plain = false,
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

  const runes = config.runes ?? {};
  const keys = Object.keys(runes);

  if (keys.length === 0) {
    process.stdout.write('No runes configured. Run `crunes create <key>` to add one.\n');
    return;
  }

  const entries = keys.map(key => {
    const entry = getRune(config, key);
    return { key, path: entry.path, name: entry.name ?? null, description: entry.description ?? null };
  });

  if (format === 'json') {
    process.stdout.write(JSON.stringify(entries, null, 2) + '\n');
    return;
  }

  if (plain) {
    for (const { key, name, description, path } of entries) {
      process.stdout.write(`${key}\t${name ?? ''}\t${description ?? ''}\t${path}\n`);
    }
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
