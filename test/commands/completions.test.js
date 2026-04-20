import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { resolveCompletions } from '../../src/commands/completions.js'

const TOP = ['use','check','bench','list','init','create','plugin','template','marketplace','completions','version','doctor']

describe('resolveCompletions — top level', () => {
  it('returns all subcommands when only crunes typed', () => {
    expect(resolveCompletions(['crunes'])).toEqual(TOP)
  })

  it('returns all subcommands when completing second token', () => {
    expect(resolveCompletions(['crunes', ''])).toEqual(TOP)
  })

  it('returns all subcommands with partial token', () => {
    expect(resolveCompletions(['crunes', 'u'])).toEqual(TOP)
  })
})

describe('resolveCompletions — rune key commands', () => {
  let dir

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crunes-test-'))
    fs.mkdirSync(path.join(dir, '.context-runes'), { recursive: true })
    fs.writeFileSync(
      path.join(dir, '.context-runes', 'config.json'),
      JSON.stringify({ runes: { release: {}, 'pkg-info': {} } }),
    )
  })

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('completes rune keys for use', () => {
    const result = resolveCompletions(['crunes', 'use', ''], { cwd: dir })
    expect(result).toContain('release')
    expect(result).toContain('pkg-info')
  })

  it('completes rune keys for check', () => {
    const result = resolveCompletions(['crunes', 'check', ''], { cwd: dir })
    expect(result).toContain('release')
  })

  it('completes rune keys for bench', () => {
    const result = resolveCompletions(['crunes', 'bench', ''], { cwd: dir })
    expect(result).toContain('release')
  })

  it('returns empty when config missing', () => {
    expect(resolveCompletions(['crunes', 'use', ''], { cwd: os.tmpdir() })).toEqual([])
  })
})

describe('resolveCompletions — plugin subcommands', () => {
  it('returns plugin subcommands', () => {
    expect(resolveCompletions(['crunes', 'plugin', ''])).toEqual(
      ['install', 'uninstall', 'list', 'update', 'enable', 'disable', 'create']
    )
  })

  it('returns installed plugin names for uninstall', () => {
    const pluginsJson = path.join(os.homedir(), '.context-runes', 'plugins.json')
    const existed = fs.existsSync(pluginsJson)
    const original = existed ? fs.readFileSync(pluginsJson, 'utf8') : null
    fs.mkdirSync(path.dirname(pluginsJson), { recursive: true })
    fs.writeFileSync(pluginsJson, JSON.stringify({ plugins: { '_local@my-plugin': {} } }))

    const result = resolveCompletions(['crunes', 'plugin', 'uninstall', ''])
    expect(result).toContain('_local@my-plugin')

    if (original !== null) fs.writeFileSync(pluginsJson, original)
    else fs.unlinkSync(pluginsJson)
  })

  it('returns installed plugin names for enable', () => {
    const pluginsJson = path.join(os.homedir(), '.context-runes', 'plugins.json')
    const existed = fs.existsSync(pluginsJson)
    const original = existed ? fs.readFileSync(pluginsJson, 'utf8') : null
    fs.mkdirSync(path.dirname(pluginsJson), { recursive: true })
    fs.writeFileSync(pluginsJson, JSON.stringify({ plugins: { '_local@my-plugin': {} } }))

    expect(resolveCompletions(['crunes', 'plugin', 'enable', ''])).toContain('_local@my-plugin')

    if (original !== null) fs.writeFileSync(pluginsJson, original)
    else fs.unlinkSync(pluginsJson)
  })
})

describe('resolveCompletions — other subcommands', () => {
  it('completes template subcommands', () => {
    expect(resolveCompletions(['crunes', 'template', ''])).toEqual(['list', 'use', 'create'])
  })

  it('completes marketplace subcommands', () => {
    expect(resolveCompletions(['crunes', 'marketplace', ''])).toEqual(
      ['add', 'remove', 'list', 'search', 'update', 'browse']
    )
  })

  it('completes completions subcommands', () => {
    expect(resolveCompletions(['crunes', 'completions', ''])).toEqual(
      ['bash', 'zsh', 'fish', 'powershell', 'install']
    )
  })

  it('completes --format value', () => {
    expect(resolveCompletions(['crunes', 'use', 'release', '--format', ''])).toEqual(['md', 'json'])
  })

  it('returns empty for unknown context', () => {
    expect(resolveCompletions(['crunes', 'use', 'release', '--plain'])).toEqual([])
  })
})

describe('resolveCompletions — --cwd flag', () => {
  let dir

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crunes-test-'))
    fs.mkdirSync(path.join(dir, '.context-runes'), { recursive: true })
    fs.writeFileSync(
      path.join(dir, '.context-runes', 'config.json'),
      JSON.stringify({ runes: { mykey: {} } }),
    )
  })

  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

  it('resolves rune keys from --cwd path', () => {
    const result = resolveCompletions(['crunes', '--cwd', dir, 'use', ''])
    expect(result).toContain('mykey')
  })
})
