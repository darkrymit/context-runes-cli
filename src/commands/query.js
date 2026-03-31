import { loadConfig, runEnricher } from '../core.js';
import { renderSection } from '../render.js';
import { output } from '../output.js';

export async function handler({
  key,
  args = [],
  format = 'md',
  projectRoot = process.cwd(),
}) {
  let config;
  try {
    config = loadConfig(projectRoot);
  } catch (err) {
    output.error(`Config unreadable: ${err.message}`);
    output.info('Run `crunes init` to create a config file.');
    process.exit(1);
  }

  let sections;
  try {
    sections = await runEnricher(projectRoot, config, key, args);
  } catch (err) {
    output.error(`Enricher "${key}" failed: ${err.message}`);
    process.exit(1);
  }

  if (!sections) {
    const available = Object.keys(config.enrichers ?? {}).join(', ') || '(none)';
    output.error(`Unknown key: "${key}". Available: ${available}`);
    process.exit(1);
  }

  if (format === 'json') {
    process.stdout.write(JSON.stringify(sections, null, 2) + '\n');
  } else {
    const rendered = sections
      .map(s => renderSection(s))
      .filter(Boolean)
      .join('\n\n');
    if (rendered) process.stdout.write(rendered + '\n');
  }
}
