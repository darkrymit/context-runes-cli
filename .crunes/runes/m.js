const SRC_ROOT = 'src'

/**
 * Builds context for the CLI module structure.
 *
 * args behavior:
 * []                      → markdown list of root modules with one-line descriptions
 * ['rune']                → layout (submodule tree) + files + full README for rune
 * ['rune.isolation']      → layout + files + README rooted at rune/isolation/ (dot = submodule separator)
 * ['plugin', 'rune']      → sections for each module concatenated (comma-separated in token: m=plugin,rune)
 *
 * Section filters:
 * ::layout → submodule layout tree only
 * ::readme → full README only
 * ::files  → JS file tree only
 *
 * Attrs on every section: { rune: 'm', module: '<path>' }
 */
export async function use(_dir, args, utils) {
  if (!await utils.fs.exists(SRC_ROOT)) return null

  if (args.length === 0) {
    const data = await buildRootMarkdown(utils)
    return utils.section.create('layout', data, { title: 'All Modules', attrs: { rune: 'm' } })
  }

  if (args.length > 1) {
    const allSections = await Promise.all(args.map(arg => generateForPath(arg.split('.'), utils)))
    return allSections.flat()
  }

  return generateForPath(args[0].split('.'), utils)
}

async function generateForPath(pathSegments, utils) {
  const targetRel = [SRC_ROOT, ...pathSegments].join('/')
  if (!await utils.fs.exists(targetRel)) {
    return utils.section.create('layout', {
      type: 'markdown',
      content: utils.md.ul([`not found: \`src/${pathSegments.join('/')}\``]),
    }, { title: 'All Modules', attrs: { rune: 'm' } })
  }

  const modulePath = pathSegments.join('/')
  const attrs = { rune: 'm', module: modulePath }
  const sections = []

  // layout — submodule tree
  const layoutData = await buildTree(targetRel, pathSegments[pathSegments.length - 1], utils)
  sections.push(utils.section.create('layout', layoutData, { title: `Module Layout: ${modulePath}`, attrs }))

  // files — flat JS file list
  const filesData = await buildFileTree(targetRel, utils)
  sections.push(utils.section.create('files', filesData, { title: `Module Files: ${modulePath}`, attrs: { ...attrs, path: targetRel } }))

  // readme — full README content
  const readmeData = await buildReadmeSection(targetRel, utils)
  sections.push(utils.section.create('readme', readmeData, { title: `Module Readme: ${modulePath}`, attrs }))

  return sections
}

async function buildRootMarkdown(utils) {
  const dirs = await listImmediateDirs(SRC_ROOT, utils)
  if (dirs.length === 0) return null

  const items = await Promise.all(dirs.map(async (name) => {
    const readmePath = `${SRC_ROOT}/${name}/README.md`
    const readmeExists = await utils.fs.exists(readmePath)
    const desc = readmeExists ? await extractDescription(readmePath, utils) : ''
    return desc
      ? `${utils.md.bold(name)} — ${desc}`
      : utils.md.bold(name)
  }))

  return { type: 'markdown', content: utils.md.ul(items) }
}

async function buildTree(targetRel, rootName, utils) {
  const readmePath = `${targetRel}/README.md`
  const desc = await utils.fs.exists(readmePath) ? await extractDescription(readmePath, utils) : ''

  return {
    type: 'tree',
    root: utils.tree.node(rootName, desc, await buildChildren(targetRel, utils)),
  }
}

async function buildReadmeSection(targetRel, utils) {
  const readmePath = `${targetRel}/README.md`
  const content = await utils.fs.read(readmePath, { throw: false })
  if (!content) {
    return { type: 'markdown', content: '_No README found for this module._' }
  }
  return { type: 'markdown', content: content.trim() }
}

async function buildFileTree(targetRel, utils) {
  const entries = await utils.fs.glob(`${targetRel}/**/*.js`)
  const prefix = `${targetRel}/`
  const paths = entries
    .sort()
    .map(e => e.startsWith(prefix) ? e.slice(prefix.length) : e)
  const content = `// base: ${targetRel}/\n${paths.join('\n')}`
  return { type: 'markdown', content }
}

async function buildChildren(parentRel, utils) {
  const dirs = await listImmediateDirs(parentRel, utils)

  return Promise.all(dirs.map(async (name) => {
    const childRel = `${parentRel}/${name}`
    const readmePath = `${childRel}/README.md`
    const desc = await utils.fs.exists(readmePath) ? await extractDescription(readmePath, utils) : ''
    return utils.tree.node(name, desc, await buildChildren(childRel, utils))
  }))
}

async function listImmediateDirs(relPath, utils) {
  const entries = await utils.fs.glob(`${relPath}/*`, { onlyDirectories: true })
  return entries
    .map(e => e.replace(/\/$/, '').split('/').pop())
    .filter(Boolean)
    .sort()
}

async function extractDescription(readmePath, utils) {
  const content = await utils.fs.read(readmePath, { throw: false })
  if (!content) return ''
  // Description is on line 3 (index 2) — trim "Full docs: …" suffix if present
  const line = content.split('\n')[2] ?? ''
  return line.trim().replace(/\s+Full docs:.*$/, '')
}
