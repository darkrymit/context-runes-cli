import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'

import {
  pluginJson,
  marketplaceJson,
  exampleRune,
  exampleTemplate,
  readmeMd,
  changelogMd,
  handler,
} from '../../../src/commands/plugin/create.js'

const BASE_OPTS = { name: 'my-plugin', description: 'A test plugin', author: 'Alice', license: 'MIT' }

// --- Template functions ---

describe('pluginJson', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(pluginJson(BASE_OPTS))).not.toThrow()
  })

  it('sets all top-level fields correctly', () => {
    const out = JSON.parse(pluginJson(BASE_OPTS))
    expect(out).toMatchObject({
      format: '1',
      name: 'my-plugin',
      version: '1.0.0',
      description: 'A test plugin',
      author: { name: 'Alice' },
      license: 'MIT',
      keywords: [],
    })
  })

  it('registers example rune with empty permissions.allow', () => {
    const { runes } = JSON.parse(pluginJson(BASE_OPTS))
    expect(runes.example).toMatchObject({
      name: 'Example Rune',
      permissions: { allow: [] },
    })
  })

  it('registers example-template', () => {
    const { templates } = JSON.parse(pluginJson(BASE_OPTS))
    expect(templates['example-template']).toMatchObject({ name: 'Example Template' })
  })

  it('matches snapshot', () => {
    expect(pluginJson(BASE_OPTS)).toMatchSnapshot()
  })
})

describe('marketplaceJson', () => {
  it('produces valid JSON', () => {
    expect(() => JSON.parse(marketplaceJson(BASE_OPTS))).not.toThrow()
  })

  it('sets owner and plugin entry correctly', () => {
    const out = JSON.parse(marketplaceJson(BASE_OPTS))
    expect(out.owner).toEqual({ name: 'Alice' })
    expect(out.plugins).toHaveLength(1)
    expect(out.plugins[0]).toMatchObject({
      name: 'my-plugin',
      version: '1.0.0',
      source: './',
      category: 'runes',
    })
  })

  it('matches snapshot', () => {
    expect(marketplaceJson(BASE_OPTS)).toMatchSnapshot()
  })
})

describe('exampleRune', () => {
  it('exports an async generate function', () => {
    expect(exampleRune()).toContain('export async function generate')
  })

  it('returns a section via utils.section', () => {
    expect(exampleRune()).toContain('utils.section')
  })

  it('matches snapshot', () => {
    expect(exampleRune()).toMatchSnapshot()
  })
})

describe('exampleTemplate', () => {
  it('exports an async generate function', () => {
    expect(exampleTemplate()).toContain('export async function generate')
  })

  it('explains copy-on-scaffold behaviour', () => {
    expect(exampleTemplate()).toContain('crunes template use')
  })

  it('matches snapshot', () => {
    expect(exampleTemplate()).toMatchSnapshot()
  })
})

describe('readmeMd', () => {
  it('contains the plugin name as h1', () => {
    expect(readmeMd(BASE_OPTS)).toContain('# my-plugin')
  })

  it('contains the description', () => {
    expect(readmeMd(BASE_OPTS)).toContain('A test plugin')
  })

  it('matches snapshot', () => {
    expect(readmeMd(BASE_OPTS)).toMatchSnapshot()
  })
})

describe('changelogMd', () => {
  it('contains a 1.0.0 entry', () => {
    expect(changelogMd()).toContain('## 1.0.0')
  })

  it('matches snapshot', () => {
    expect(changelogMd()).toMatchSnapshot()
  })
})

// --- Handler ---

function makeTmp() {
  const dir = join(os.tmpdir(), `crunes-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

describe('handler (non-interactive)', () => {
  let exitSpy

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('validation', () => {
    it('exits 1 when name is missing', async () => {
      await expect(handler({ description: 'x', yes: true })).rejects.toThrow('process.exit(1)')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })

    it('exits 1 when description is missing', async () => {
      await expect(handler({ name: 'x', yes: true })).rejects.toThrow('process.exit(1)')
      expect(exitSpy).toHaveBeenCalledWith(1)
    })
  })

  describe('directory guard', () => {
    it('exits 1 when output dir is non-empty', async () => {
      const tmp = makeTmp()
      writeFileSync(join(tmp, 'existing.txt'), 'data')
      try {
        await expect(handler({ name: 'x', description: 'y', out: tmp, yes: true }))
          .rejects.toThrow('process.exit(1)')
        expect(exitSpy).toHaveBeenCalledWith(1)
      } finally {
        rmSync(tmp, { recursive: true, force: true })
      }
    })

    it('proceeds when output dir exists but is empty', async () => {
      const tmp = makeTmp()
      const out = join(tmp, 'empty-out')
      mkdirSync(out)
      try {
        await handler({ ...BASE_OPTS, out, yes: true })
        expect(existsSync(join(out, 'README.md'))).toBe(true)
      } finally {
        rmSync(tmp, { recursive: true, force: true })
      }
    })
  })

  describe('file scaffolding', () => {
    let tmp, out

    beforeEach(() => {
      tmp = makeTmp()
      out = join(tmp, 'my-plugin')
    })

    afterEach(() => {
      rmSync(tmp, { recursive: true, force: true })
    })

    it('creates all 6 expected files', async () => {
      await handler({ ...BASE_OPTS, out, yes: true })
      for (const rel of [
        '.context-runes-plugin/plugin.json',
        '.context-runes-plugin/marketplace.json',
        'runes/example.js',
        'templates/example-template.js',
        'README.md',
        'CHANGELOG.md',
      ]) {
        expect(existsSync(join(out, rel)), rel).toBe(true)
      }
    })

    it('writes valid plugin.json with correct name', async () => {
      await handler({ ...BASE_OPTS, out, yes: true })
      const pj = JSON.parse(readFileSync(join(out, '.context-runes-plugin', 'plugin.json'), 'utf8'))
      expect(pj.name).toBe('my-plugin')
      expect(pj.format).toBe('1')
    })

    it('defaults license to MIT when not provided', async () => {
      await handler({ ...BASE_OPTS, license: undefined, out, yes: true })
      const pj = JSON.parse(readFileSync(join(out, '.context-runes-plugin', 'plugin.json'), 'utf8'))
      expect(pj.license).toBe('MIT')
    })

    it('resolves out directory relative to projectRoot', async () => {
      const relOut = 'my-plugin'
      await handler({ ...BASE_OPTS, out: relOut, yes: true, projectRoot: tmp })
      expect(existsSync(join(tmp, 'my-plugin', 'README.md'))).toBe(true)
    })
  })
})
