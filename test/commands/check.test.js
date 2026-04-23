import { describe, it, expect, vi } from 'vitest'

vi.mock('../../src/core.js', () => ({ loadConfig: vi.fn(), runRune: vi.fn() }))

import { scanPermissionWarnings } from '../../src/commands/check.js'

describe('scanPermissionWarnings', () => {
  it('returns empty array for rune with no gated utils', () => {
    expect(scanPermissionWarnings('const x = 1')).toEqual([])
  })

  it('detects utils.fs usage', () => {
    expect(scanPermissionWarnings('const data = await utils.fs.read("package.json")')).toContain('utils.fs')
  })

  it('detects utils.shell usage', () => {
    expect(scanPermissionWarnings('const out = await utils.shell("npm list")')).toContain('utils.shell')
  })

  it('detects utils.fetch usage', () => {
    expect(scanPermissionWarnings('const res = await utils.fetch("https://api.example.com")')).toContain('utils.fetch')
  })

  it('detects multiple gated utils in same source', () => {
    const src = 'await utils.fs.read("x"); await utils.fetch("http://example.com")'
    const warnings = scanPermissionWarnings(src)
    expect(warnings).toContain('utils.fs')
    expect(warnings).toContain('utils.fetch')
    expect(warnings).not.toContain('utils.shell')
  })

  it('returns empty array for empty source', () => {
    expect(scanPermissionWarnings('')).toEqual([])
  })
})
