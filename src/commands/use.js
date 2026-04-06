import { loadConfig, runRune } from '../core.js'
import { renderSection } from '../render.js'
import { output } from '../output.js'
import { parseKeyToken } from '../parse-key-token.js'

export async function handler({
  keys,
  format = 'md',
  failFast = false,
  projectRoot = process.cwd(),
}) {
  let config
  try {
    config = loadConfig(projectRoot)
  } catch (err) {
    output.error(`Config unreadable: ${err.message}`)
    output.info('Run `crunes init` to create a config file.')
    process.exit(1)
  }

  const allSections = []
  let anyFailed = false

  for (const token of keys) {
    const { key, args, sections: sectionFilter } = parseKeyToken(token)

    let sections
    try {
      sections = await runRune(projectRoot, config, key, args, { sections: sectionFilter })
    } catch (err) {
      output.error(`Rune "${key}" failed: ${err.message}`)
      anyFailed = true
      if (failFast) process.exit(1)
      continue
    }

    if (!sections) {
      const available = Object.keys(config.runes ?? {}).join(', ') || '(none)'
      output.error(`Unknown key: "${key}". Available: ${available}`)
      anyFailed = true
      if (failFast) process.exit(1)
      continue
    }

    const filtered = sectionFilter
      ? sections.filter(s => sectionFilter.includes(s.name))
      : sections

    allSections.push(...filtered)
  }

  if (format === 'json') {
    process.stdout.write(JSON.stringify(allSections, null, 2) + '\n')
  } else {
    const rendered = allSections
      .map(s => renderSection(s))
      .filter(Boolean)
      .join('\n\n')
    if (rendered) process.stdout.write(rendered + '\n')
  }

  if (anyFailed) process.exit(1)
}
