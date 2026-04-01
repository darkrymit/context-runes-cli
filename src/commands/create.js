import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { intro, outro, text, select, cancel } from '@clack/prompts';
import { output } from '../output.js';

const VALID_FORMATS = ['tree', 'markdown'];

function template(key, format) {
  const header =
    `export function generate(dir, args, utils) {\n` +
    `  // args: string[] passed from $${key}(arg1, arg2)\n`;

  if (format === 'tree') {
    return (
      header +
      `  const root = utils.tree.node('${key}', 'Root description', [\n` +
      `    utils.tree.node('child', 'Child description'),\n` +
      `  ]);\n` +
      `  return utils.section('example-tree', { type: 'tree', root });\n` +
      `}\n`
    );
  }

  // markdown
  return (
    header +
    `  const content = [\n` +
    `    utils.md.h3('${key}'),\n` +
    `    utils.md.ul(['Replace with real data']),\n` +
    `  ].join('\\n');\n` +
    `  return utils.section('example-md', { type: 'markdown', content });\n` +
    `}\n`
  );
}

export async function handler({
  key,
  format,
  path: enricherRelPath,
  name,
  description,
  yes = false,
  projectRoot = process.cwd(),
} = {}) {
  const isNonInteractive = yes || !process.stdout.isTTY;

  if (isNonInteractive) {
    if (!key) {
      output.error('Missing required argument: <key>');
      process.exit(1);
    }
    if (!format || !VALID_FORMATS.includes(format)) {
      output.error(`Missing or invalid --format. Must be one of: ${VALID_FORMATS.join(', ')}`);
      process.exit(1);
    }
  } else {
    intro('context-runes create');

    if (!key) {
      const result = await text({ message: 'Enricher key?', validate: v => v ? undefined : 'Required' });
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return; }
      key = result;
    }

    if (!format) {
      const result = await select({
        message: 'Output format?',
        options: [
          { value: 'tree', label: 'tree', hint: 'hierarchical ASCII tree structure' },
          { value: 'markdown', label: 'markdown', hint: 'freeform markdown content' },
        ],
      });
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return; }
      format = result;
    }

    if (!enricherRelPath) {
      const defaultPath = `.context-runes/enrichers/${key}.js`;
      const result = await text({ message: 'File path?', initialValue: defaultPath });
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return; }
      enricherRelPath = result;
    }

    if (!name) {
      const result = await text({ message: 'Name? (optional)', placeholder: 'Human-readable label for crunes list' });
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return; }
      name = result || undefined;
    }

    if (!description) {
      const result = await text({ message: 'Description? (optional)', placeholder: 'What context does this enricher provide?' });
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return; }
      description = result || undefined;
    }
  }

  enricherRelPath = enricherRelPath ?? `.context-runes/enrichers/${key}.js`;
  const enricherAbsPath = join(projectRoot, enricherRelPath);

  mkdirSync(dirname(enricherAbsPath), { recursive: true });
  writeFileSync(enricherAbsPath, template(key, format));

  // Register in config — write object format to support name/description
  const configPath = join(projectRoot, '.context-runes', 'config.json');
  let config = { enrichers: {} };
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, 'utf8')); } catch {}
  }
  const entry = name || description
    ? { path: enricherRelPath, ...(name && { name }), ...(description && { description }) }
    : enricherRelPath;
  config.enrichers = { ...(config.enrichers ?? {}), [key]: entry };
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');

  if (!isNonInteractive) {
    outro(`Created ${enricherRelPath}\nRun: crunes query ${key}`);
  } else {
    output.success(`Created ${enricherRelPath}`);
    output.info(`Run: crunes query ${key}`);
  }
}
