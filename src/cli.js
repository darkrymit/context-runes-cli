#!/usr/bin/env node
import path from 'node:path'
import { Command } from 'commander'
import { configure as configureOutput } from './output.js'
import { handler as queryHandler } from './commands/query.js'
import { handler as runHandler } from './commands/run.js'
import { handler as listHandler } from './commands/list.js'
import { handler as validateHandler } from './commands/validate.js'
import { handler as initHandler } from './commands/init.js'
import { handler as createHandler } from './commands/create.js'
import { handler as pluginInstallHandler } from './commands/plugin/install.js'
import { handler as pluginUninstallHandler } from './commands/plugin/uninstall.js'
import { handler as pluginListHandler } from './commands/plugin/list.js'
import { handler as pluginUpdateHandler } from './commands/plugin/update.js'
import { handler as pluginEnableHandler } from './commands/plugin/enable.js'
import { handler as pluginDisableHandler } from './commands/plugin/disable.js'
import { handler as marketplaceAddHandler } from './commands/marketplace/add.js'
import { handler as marketplaceRemoveHandler } from './commands/marketplace/remove.js'
import { handler as marketplaceListHandler } from './commands/marketplace/list.js'
import { handler as marketplaceSearchHandler } from './commands/marketplace/search.js'
import { handler as marketplaceUpdateHandler } from './commands/marketplace/update.js'
import { handler as marketplaceBrowseHandler } from './commands/marketplace/browse.js'
import { handleCreateFrom } from './commands/plugin/create-from.js'

const program = new Command()

program
  .name('crunes')
  .description('CLI tool for managing context runes')
  .version('1.2.0')
  .option('-y, --yes', 'assume yes to all prompts and skip interactive mode (also auto-detected in non-TTY environments)')
  .option('-p, --plain', 'plain output: no colors, no box-drawing, plain symbols — optimised for AI/pipe use')
  .option('--cwd <path>', 'project root to use instead of the current working directory')

program.hook('preAction', () => {
  configureOutput({ plain: !!program.opts().plain })
})

function projectRoot() {
  const cwd = program.opts().cwd
  return cwd ? path.resolve(process.cwd(), cwd) : process.cwd()
}

program
  .command('query <key> [args...]')
  .description('Query a rune and print its output')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (key, args, opts) => {
    await queryHandler({ key, args, format: opts.format, projectRoot: projectRoot() })
  })

program
  .command('run <key> [args...]')
  .description('Query a rune — alias for query --format md')
  .action(async (key, args) => {
    await runHandler({ key, args, projectRoot: projectRoot() })
  })

program
  .command('list')
  .description('List all registered runes')
  .option('--format <format>', 'output format: md (default) or json', 'md')
  .action(async (opts) => {
    await listHandler({ format: opts.format, plain: !!program.opts().plain, projectRoot: projectRoot() })
  })

program
  .command('validate')
  .description('Check that all registered runes exist and export generate()')
  .action(async () => {
    await validateHandler({ yes: !!program.opts().yes, projectRoot: projectRoot() })
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
  .option('--from <marketplace@plugin>', 'copy a rune template from an installed plugin')
  .option('--format <format>', 'rune output format: tree or markdown')
  .option('--path <path>', 'file path for the rune (default: .context-runes/runes/<key>.js)')
  .option('--name <name>', 'human-readable label shown in crunes list')
  .option('--description <description>', 'short description of what context this rune provides')
  .action(async (key, opts) => {
    if (opts.from) {
      try {
        const result = await handleCreateFrom({ from: opts.from, key, runeRelPath: opts.path, name: opts.name, description: opts.description, yes: !!program.opts().yes, projectRoot: projectRoot() })
        if (program.opts().yes || !process.stdout.isTTY) {
          console.log(`Created ${result.runeRelPath}`)
        }
      } catch (err) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
      }
      return
    }
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

program.parse()
