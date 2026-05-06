const TYPE_DIRS   = { m: 'modules', f: 'flows', s: 'system' }
const TYPE_LABELS = { m: 'Modules', f: 'Flows', s: 'System' }
const KB_ROOT = 'docs/knowledge-base'

/**
 * Builds context for the project knowledge base.
 *
 * args behavior:
 * []                     → sections: all types with all entries (index mode)
 * ['f']                  → one section: all flow entries (index mode)
 * ['m', 'rune', 'plugin']  → full content of rune and plugin module docs (content mode)
 *
 * Section filters (content mode only):
 * ::index    → description-only list, no full content
 * ::<name>   → single entry by name (e.g. ::rune)
 *
 * Attrs on every section: { rune: 'kb', type: 'modules'|'flows'|'system' }
 * Content sections also carry: { entry: '<name>' }
 */
export async function use(_dir, args, utils) {
  if (!await utils.fs.exists(KB_ROOT)) return null

  if (args.length === 0) {
    return buildRoot(utils)
  }

  const [type, ...allowedNames] = args
  if (!TYPE_DIRS[type]) {
    return [utils.section.create('knowledge-base',
      { type: 'markdown', content: utils.md.ul([`unknown kb type: \`${type}\`. Supported: m (modules), f (flows), s (system)`]) },
      { title: 'Knowledge Base' }
    )]
  }

  return buildTypeSection(type, allowedNames, utils)
}

async function buildRoot(utils) {
  const sections = []
  for (const type of Object.keys(TYPE_DIRS)) {
    const result = await buildTypeSection(type, [], utils)
    if (result) sections.push(...result)
  }
  return sections.length > 0 ? sections : null
}

async function buildTypeSection(type, allowedNames, utils) {
  const dirPath = `${KB_ROOT}/${TYPE_DIRS[type]}`
  let files = await utils.fs.glob(`${dirPath}/*.md`, { throw: false })
  if (!files || files.length === 0) return null

  files = files.map(f => f.split('/').pop().replace(/\.md$/, '')).sort()

  if (allowedNames.length > 0) {
    files = files.filter(name => allowedNames.includes(name))
  }

  if (files.length === 0) return null

  const baseAttrs = { rune: 'kb', type: TYPE_DIRS[type] }

  // Index mode: no specific entries requested — return description-only list
  if (allowedNames.length === 0) {
    const items = await Promise.all(files.map(async (name) => ({
      name,
      description: await extractDescription(`${dirPath}/${name}.md`, utils),
    })))
    const content = utils.md.ul(
      items.map(({ name, description }) =>
        description ? `${utils.md.bold(name)} — ${description}` : utils.md.bold(name)
      )
    )
    return [utils.section.create('knowledge-base',
      { type: 'markdown', content },
      { title: TYPE_LABELS[type], attrs: baseAttrs }
    )]
  }

  // Content mode: specific entries requested.
  const sections = []
  const contentSections = await Promise.all(files.map(async (name) => {
    const raw = await utils.fs.read(`${dirPath}/${name}.md`, { throw: false })
    const content = raw ? raw.trim() : `_No content found for \`${name}\`._`
    return utils.section.create(name,
      { type: 'markdown', content },
      { title: `Knowledge Base ${TYPE_LABELS[type].slice(0, -1)}: ${name}`, attrs: { ...baseAttrs, entry: name } }
    )
  }))
  sections.push(...contentSections)

  return sections
}

async function extractDescription(relPath, utils) {
  const content = await utils.fs.read(relPath, { throw: false })
  if (!content) return ''
  const lines = content.split('\n')
  let dashCount = 0
  let frontmatterDone = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!frontmatterDone && trimmed === '---') {
      dashCount++
      if (dashCount === 2) frontmatterDone = true
      continue
    }
    if (dashCount === 1) continue
    // First blockquote line after frontmatter (or from start) is the description
    if (trimmed.startsWith('> ')) return trimmed.slice(2).trim()
  }
  return ''
}
