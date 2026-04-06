import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { intro, outro, text, cancel } from '@clack/prompts'
import { output } from '../../output.js'

function templateStub(name) {
  return (
    `export async function generate(dir, args, utils, opts) {\n` +
    `  // dir  — absolute path to the user's project root\n` +
    `  // args — string[] passed via $key=arg1,arg2\n` +
    `  // utils — { md, tree, section, fs, shell, rune }\n` +
    `  // opts.sections — string[] | null — requested sections (performance hint)\n` +
    `\n` +
    `  const content = [\n` +
    `    utils.md.h3('${name}'),\n` +
    `    utils.md.ul(['Replace with real output']),\n` +
    `  ].join('\\n');\n` +
    `  return utils.section('example-md', { type: 'markdown', content });\n` +
    `}\n`
  )
}

export async function handler({
  name,
  path: templateRelPath,
  templateName,
  description,
  yes = false,
  projectRoot = process.cwd(),
} = {}) {
  const isNonInteractive = yes || !process.stdout.isTTY

  if (isNonInteractive) {
    if (!name) {
      output.error('Missing required argument: <name>')
      process.exit(1)
    }
  } else {
    intro('context-runes template create')

    if (!name) {
      const result = await text({ message: 'Template name?', validate: v => v ? undefined : 'Required' })
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return }
      name = result
    }

    if (!templateRelPath) {
      const defaultPath = `.context-runes/templates/${name}.js`
      const result = await text({ message: 'File path?', initialValue: defaultPath })
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return }
      templateRelPath = result
    }

    if (!templateName) {
      const result = await text({ message: 'Display name? (optional)', placeholder: 'Human-readable label for crunes template list' })
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return }
      templateName = result || undefined
    }

    if (!description) {
      const result = await text({ message: 'Description? (optional)', placeholder: 'What kind of rune does this template produce?' })
      if (result === Symbol.for('clack:cancel')) { cancel('Cancelled.'); return }
      description = result || undefined
    }
  }

  templateRelPath = templateRelPath ?? `.context-runes/templates/${name}.js`
  const templateAbsPath = join(projectRoot, templateRelPath)

  mkdirSync(dirname(templateAbsPath), { recursive: true })
  writeFileSync(templateAbsPath, templateStub(name))

  // Register in config under templates key
  const configPath = join(projectRoot, '.context-runes', 'config.json')
  let config = { runes: {} }
  if (existsSync(configPath)) {
    try { config = JSON.parse(readFileSync(configPath, 'utf8')) } catch {}
  }

  const entry = templateName || description
    ? { path: templateRelPath, ...(templateName && { name: templateName }), ...(description && { description }) }
    : templateRelPath
  config.templates = { ...(config.templates ?? {}), [name]: entry }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')

  if (!isNonInteractive) {
    outro(`Created ${templateRelPath}\nUse it with: crunes template use ${name}`)
  } else {
    output.success(`Created ${templateRelPath}`)
    output.info(`Use it with: crunes template use ${name}`)
  }
}
