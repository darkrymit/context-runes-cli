import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { intro, outro, confirm, cancel } from '@clack/prompts';
import { output } from '../output.js';

const EMPTY_CONFIG = JSON.stringify({ enrichers: {} }, null, 2) + '\n';

export async function handler({
  yes = false,
  nonInteractive = false,
  projectRoot = process.cwd(),
} = {}) {
  const configDir = join(projectRoot, '.context-runes');
  const configPath = join(configDir, 'config.json');
  const isNonInteractive = nonInteractive || !process.stdout.isTTY;

  if (existsSync(configPath)) {
    if (!yes) {
      if (isNonInteractive) {
        output.error('Config already exists. Use --yes to overwrite.');
        process.exit(1);
      }

      intro('context-runes init');
      const overwrite = await confirm({
        message: 'Config already exists. Overwrite?',
        initialValue: false,
      });

      if (!overwrite || overwrite === Symbol.for('clack:cancel')) {
        cancel('Cancelled.');
        return;
      }
    }
  }

  mkdirSync(configDir, { recursive: true });
  writeFileSync(configPath, EMPTY_CONFIG);

  if (!isNonInteractive) {
    outro(`Created ${configPath}`);
  } else {
    output.success(`Created ${configPath}`);
  }
}
