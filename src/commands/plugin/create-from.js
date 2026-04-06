import fs from 'node:fs/promises'
import path from 'node:path'
import { intro, outro, select, text, cancel, confirm } from '@clack/prompts'
import { loadRegistry, resolvePluginKey } from '../../plugins/registry.js'
import { loadPluginJson } from '../../plugins/manifest.js'

/**
 * Handle `crunes create --from <marketplace@plugin> [key]`
 * Copies a rune template from an installed plugin into the project.
 */
export async function handleCreateFrom({ from, key, runeRelPath, name, description, yes = false, projectRoot }) {
  const isNonInteractive = yes || !process.stdout.isTTY

  // Resolve the plugin entry from the registry (bare name or full marketplace@plugin key)
  const registry = await loadRegistry()
  const pluginKey = resolvePluginKey(from, registry)
  if (!pluginKey) throw new Error(`Plugin "${from}" is not installed. Run: crunes plugin list`)
  const entry = registry.plugins[pluginKey]

  const pluginJson = await loadPluginJson(entry.path)
  const templates = pluginJson.templates ?? {}
  const templateKeys = Object.keys(templates)

  if (templateKeys.length === 0) {
    throw new Error(`Plugin "${from}" does not provide any rune templates.`)
  }

  // Resolve which template key to use
  if (!key) {
    if (isNonInteractive) {
      throw new Error(`Missing required argument: <key>. Available templates: ${templateKeys.join(', ')}`)
    }
    intro(`context-runes create --from ${from}`)
    const result = await select({
      message: 'Which template?',
      options: templateKeys.map(k => ({
        value: k,
        label: k,
        hint: templates[k].description ?? templates[k].name ?? '',
      })),
    })
    if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); process.exit(0) }
    key = result
  }

  if (!templates[key]) {
    throw new Error(`Template "${key}" not found in plugin "${from}". Available: ${templateKeys.join(', ')}`)
  }

  const templateSrc = path.join(entry.path, 'runes-templates', `${key}.js`)
  try {
    await fs.access(templateSrc)
  } catch {
    throw new Error(`Template file not found in plugin: runes-templates/${key}.js`)
  }

  runeRelPath = runeRelPath ?? `.context-runes/runes/${key}.js`
  const runeAbsPath = path.join(projectRoot, runeRelPath)

  // Confirm overwrite if file exists
  try {
    await fs.access(runeAbsPath)
    if (!isNonInteractive) {
      const ok = await confirm({ message: `${runeRelPath} already exists. Overwrite?` })
      if (!ok || ok === Symbol.for('clack:cancel')) { cancel('Cancelled.'); process.exit(0) }
    }
  } catch { /* file doesn't exist — fine */ }

  await fs.mkdir(path.dirname(runeAbsPath), { recursive: true })
  await fs.copyFile(templateSrc, runeAbsPath)

  // Register in config
  const configPath = path.join(projectRoot, '.context-runes', 'config.json')
  let config = { runes: {} }
  try {
    config = JSON.parse(await fs.readFile(configPath, 'utf8'))
  } catch { /* no config yet */ }

  const templateMeta = templates[key]
  const resolvedName = name ?? templateMeta.name
  const resolvedDesc = description ?? templateMeta.description
  const configEntry = {
    path: runeRelPath,
    ...(resolvedName && { name: resolvedName }),
    ...(resolvedDesc && { description: resolvedDesc }),
    permissions: templateMeta.permissions ?? { allow: [], deny: [] },
  }
  config.runes = { ...(config.runes ?? {}), [key]: configEntry }

  const tmp = configPath + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(config, null, 2) + '\n', 'utf8')
  await fs.rename(tmp, configPath)

  if (!isNonInteractive) {
    outro(`Created ${runeRelPath} from ${from}\nRun: crunes query ${key}`)
  }

  return { key, runeRelPath }
}
