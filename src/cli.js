#!/usr/bin/env node
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const majorVersion = parseInt(process.versions.node.split('.')[0], 10)
if (majorVersion >= 20 && !process.execArgv.includes('--no-node-snapshot')) {
  const result = spawnSync(process.execPath, ['--no-node-snapshot', ...process.argv.slice(1)], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}
import { Command } from 'commander'
import { configure as configureOutput } from './utils/output.js'
import { handler as useHandler } from './commands/use.js'
import { handler as listHandler } from './commands/list.js'
import { handler as initHandler } from './commands/init.js'
import { handler as createHandler } from './commands/create.js'
import { handler as pluginInstallHandler } from './commands/plugin/install.js'
import { handler as pluginUninstallHandler } from './commands/plugin/uninstall.js'
import { handler as pluginListHandler } from './commands/plugin/list.js'
import { handler as pluginUpdateHandler } from './commands/plugin/update.js'
import { handler as pluginEnableHandler } from './commands/plugin/enable.js'
import { handler as pluginDisableHandler } from './commands/plugin/disable.js'
import { handler as pluginCreateHandler } from './commands/plugin/create.js'
import { handler as marketplaceAddHandler } from './commands/marketplace/add.js'
import { handler as marketplaceRemoveHandler } from './commands/marketplace/remove.js'
import { handler as marketplaceListHandler } from './commands/marketplace/list.js'
import { handler as marketplaceSearchHandler } from './commands/marketplace/search.js'
import { handler as marketplaceUpdateHandler } from './commands/marketplace/update.js'
import { handler as marketplaceBrowseHandler } from './commands/marketplace/browse.js'
import { handler as benchmarkHandler } from './commands/benchmark.js'
import { handler as versionHandler } from './commands/version.js'
import { handler as doctorHandler } from './commands/doctor.js'
import { handler as checkHandler } from './commands/check.js'
import { handler as templateListHandler } from './commands/template/list.js'
import { handler as templateUseHandler } from './commands/template/use.js'
import { handler as templateCreateHandler } from './commands/template/create.js'

const program = new Command()

program
  .name('crunes')
  .description('CLI tool for managing context runes')
  .version('1.3.12', '-v, --version')
  .option('-y, --yes', 'assume yes to all prompts and skip interactive mode (also auto-detected in non-TTY environments)')
  .option('-p, --plain', 'plain output: no colors, no box-drawing, plain symbols — optimised for AI/pipe use')
  .option('--cwd <path>', 'project root to use instead of the current working directory')
  .option('--verbose', 'print full error stack traces and other verbose output')

program.hook('preAction', (thisCommand, actionCommand) => {
  configureOutput({ plain: !!program.opts().plain, verbose: !!program.opts().verbose })
  if (program.opts().verbose) {
    console.error(`[crunes:debug] Executing command: ${actionCommand.name()}`)
  }
})

function projectRoot() {
  const cwd = program.opts().cwd
  return cwd ? path.resolve(process.cwd(), cwd) : process.cwd()
}

program
  .command('use <key>')
  .description(
    'Use one or more runes and output the result.\n' +
    '  Key format: [source:]name[=arg1,arg2][::section1,section2]\n' +
    '  local:name  — resolve from project config only\n' +
    '  plugin:name — resolve directly from an enabled plugin\n' +
    '  name        — auto-resolve: project config first, then enabled plugins'
  )
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .option('-a, --and <key>', 'add another rune key to the batch (repeatable)', (val, acc) => [...acc, val], [])
  .option('--fail-fast', 'stop on first rune error (default: run all, exit 1 if any failed)')
  .action(async (key, opts) => {
    const keys = [key, ...opts.and]
    await useHandler({ keys, format: opts.format, failFast: !!opts.failFast, projectRoot: projectRoot() })
  })

program
  .command('version')
  .description('Print the installed version and check for updates')
  .option('--no-check', 'skip the npm update check')
  .action(async (opts) => {
    await versionHandler({ check: opts.check, plain: !!program.opts().plain })
  })

program
  .command('doctor')
  .description('Verify environment and project setup')
  .action(async () => {
    await doctorHandler({ projectRoot: projectRoot() })
  })

program
  .command('check <key>')
  .description('Run a rune and validate its output shape')
  .action(async (key) => {
    await checkHandler({ key, projectRoot: projectRoot() })
  })

program
  .command('bench [key]')
  .description(
    'Time rune execution and report which runes are fast, ok, or slow.\n' +
    '  Benchmarks all registered runes when no key is given.\n' +
    '  Key supports local:name, plugin:name, or bare name (same as crunes use).'
  )
  .option('--runs <n>', 'number of runs to average (default: 1)', v => parseInt(v, 10), 1)
  .action(async (key, opts) => {
    await benchmarkHandler({ key, runs: opts.runs, plain: !!program.opts().plain, projectRoot: projectRoot() })
  })

program
  .command('list')
  .description('List all registered runes')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (opts) => {
    await listHandler({ format: opts.format, plain: !!program.opts().plain, projectRoot: projectRoot() })
  })

program
  .command('init')
  .description('Create .context-runes/config.json in the current project')
  .action(async () => {
    await initHandler({ yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

program
  .command('create [key]')
  .description('Scaffold a new rune and register it in config')
  .option('--format <format>', 'rune output format: tree or markdown')
  .option('--path <path>', 'file path for the rune (default: .context-runes/runes/<key>.js)')
  .option('--name <name>', 'human-readable label shown in crunes list')
  .option('--description <description>', 'short description of what context this rune provides')
  .action(async (key, opts) => {
    await createHandler({ key, format: opts.format, path: opts.path, name: opts.name, description: opts.description, yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

// Plugin management commands
const plugin = program.command('plugin').description('Manage rune plugins')

plugin
  .command('install <source>')
  .description('Install a plugin from a local path, GitHub repo (owner/repo), git URL, or npm package')
  .action(async (source) => {
    await pluginInstallHandler({ source, projectRoot: projectRoot() })
  })

plugin
  .command('uninstall <name>')
  .description('Uninstall an installed plugin')
  .action(async (name) => {
    await pluginUninstallHandler({ name, yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

plugin
  .command('list')
  .description('List installed plugins')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (opts) => {
    await pluginListHandler({ format: opts.format })
  })

plugin
  .command('update [name]')
  .description('Update one or all installed plugins')
  .action(async (name) => {
    await pluginUpdateHandler({ name, projectRoot: projectRoot() })
  })

plugin
  .command('enable <name>')
  .description('Add a plugin to this project\'s enabled list')
  .action(async (name) => {
    await pluginEnableHandler({ name, projectRoot: projectRoot() })
  })

plugin
  .command('disable <name>')
  .description('Remove a plugin from this project\'s enabled list')
  .action(async (name) => {
    await pluginDisableHandler({ name, projectRoot: projectRoot() })
  })

plugin
  .command('create [name]')
  .description('Scaffold a new plugin directory with all required files')
  .option('--description <text>', 'short description for plugin.json and marketplace.json')
  .option('--author <name>', 'author name (default: git config user.name)')
  .option('--license <spdx>', 'SPDX license identifier (default: MIT)')
  .option('--out <path>', 'output directory (default: ./<name>)')
  .action(async (name, opts) => {
    await pluginCreateHandler({ name, description: opts.description, author: opts.author, license: opts.license, out: opts.out, yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

// Template commands
const template = program.command('template').description('Manage rune templates')

template
  .command('list [source]')
  .description('List available templates. [source] can be "local" (project config only) or a plugin name; omit to list all.')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (source, opts) => {
    await templateListHandler({ source, format: opts.format, plain: !!program.opts().plain, projectRoot: projectRoot() })
  })

template
  .command('use <key>')
  .description(
    'Copy a template into the project as a new rune and register it in config.\n' +
    '  local:name  — use a template defined in this project\'s config\n' +
    '  plugin:name — use a template from a specific installed plugin\n' +
    '  name        — auto-resolve: project config first, then installed plugins'
  )
  .option('--as <rune-key>', 'register the rune under a different key (default: template name)')
  .option('--path <path>', 'file path for the rune (default: .context-runes/runes/<key>.js)')
  .option('--name <name>', 'human-readable label shown in crunes list')
  .option('--description <description>', 'short description of what context this rune provides')
  .action(async (ref, opts) => {
    await templateUseHandler({ ref, key: opts.as, path: opts.path, name: opts.name, description: opts.description, yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

template
  .command('create [name]')
  .description('Scaffold a new template file and register it in config')
  .option('--path <path>', 'file path for the template (default: .context-runes/templates/<name>.js)')
  .option('--name <name>', 'display label shown in crunes template list (separate from the template key)')
  .option('--description <description>', 'short description of what kind of rune this template produces')
  .action(async (name, opts) => {
    await templateCreateHandler({ name, path: opts.path, templateName: opts.name, description: opts.description, yes: !!program.opts().yes, projectRoot: projectRoot() })
  })

// Marketplace commands
const marketplace = program.command('marketplace').description('Manage plugin marketplace sources')

marketplace
  .command('add <url>')
  .description('Add a marketplace source URL')
  .action(async (url) => {
    await marketplaceAddHandler({ url })
  })

marketplace
  .command('remove <url>')
  .description('Remove a marketplace source URL')
  .action(async (url) => {
    await marketplaceRemoveHandler({ url })
  })

marketplace
  .command('list')
  .description('List configured marketplace sources')
  .action(async () => {
    await marketplaceListHandler()
  })

marketplace
  .command('search <query>')
  .description('Search for plugins across configured marketplace sources')
  .action(async (query) => {
    await marketplaceSearchHandler({ query })
  })

marketplace
  .command('update [url]')
  .description('Refresh cached marketplace data (all sources if no URL given)')
  .action(async (url) => {
    await marketplaceUpdateHandler({ url })
  })

marketplace
  .command('browse')
  .description('List all plugins from all configured marketplace sources')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (opts) => {
    await marketplaceBrowseHandler({ format: opts.format })
  })

process.on('uncaughtException', (err) => {
  console.error('[crunes] FATAL UNCAUGHT EXCEPTION:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  console.error('[crunes] FATAL UNHANDLED REJECTION:', reason)
  process.exit(1)
})

// -v is contextual: acts as --verbose when a command is present, --version when used alone
const hasCommand = process.argv.length > 2 && !process.argv[2].startsWith('-')
if (hasCommand) {
  const vIndex = process.argv.indexOf('-v')
  if (vIndex !== -1) process.argv[vIndex] = '--verbose'
}

program.parseAsync(process.argv).catch(err => {
  console.error('[crunes] FATAL CLI ERROR:', err)
  process.exit(1)
})
