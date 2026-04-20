import { describe, it, expect } from 'vitest'
import {
  computeEffectivePermissions,
  makePermissionChecker,
  PermissionError,
} from '../../src/isolation/permissions.js'

describe('computeEffectivePermissions', () => {
  it('uses plugin allow when no project override', () => {
    const result = computeEffectivePermissions({ allow: ['fs.read:**'] }, undefined)
    expect(result.allow).toEqual(['fs.read:./**'])
  })

  it('project allow fully replaces plugin allow', () => {
    const result = computeEffectivePermissions(
      { allow: ['fs.read:**'] },
      { allow: ['fs.read:src/**'] }
    )
    expect(result.allow).toEqual(['fs.read:./src/**'])
  })

  it('merges plugin deny and project deny', () => {
    const result = computeEffectivePermissions(
      { allow: [], deny: ['shell:**'] },
      { deny: ['fs.read:/etc/**'] }
    )
    expect(result.deny).toContain('shell:**')
    expect(result.deny).toContain('fs.read:/etc/**')
  })

  it('handles missing allow/deny gracefully', () => {
    const result = computeEffectivePermissions({}, undefined)
    expect(result.allow).toEqual([])
    expect(result.deny).toEqual([])
  })

  it('project deny adds to plugin deny even when project allow is set', () => {
    const result = computeEffectivePermissions(
      { allow: ['fs.read:**'], deny: ['shell:**'] },
      { allow: ['fs.read:**'], deny: ['fs.write:**'] }
    )
    expect(result.deny).toContain('shell:**')
    expect(result.deny).toContain('fs.write:**')
  })
  it('normalizes fs.read and fs.glob relative paths to use ./ prefix', () => {
    const result = computeEffectivePermissions(
      { allow: ['fs.read:package.json'] },
      { allow: ['fs.glob:src/*.js'] }
    )
    expect(result.allow).toEqual(['fs.glob:./src/*.js'])

    const result2 = computeEffectivePermissions(
      { allow: ['fs.read:package.json'] },
      undefined
    )
    expect(result2.allow).toEqual(['fs.read:./package.json'])
  })
})

describe('makePermissionChecker', () => {
  it('passes when token matches allow glob', () => {
    const check = makePermissionChecker({ allow: ['fs.read:package.json'], deny: [] })
    expect(() => check('fs.read', 'package.json')).not.toThrow()
  })

  it('throws PermissionError when token is not in allow', () => {
    const check = makePermissionChecker({ allow: ['fs.read:src/**'], deny: [] })
    expect(() => check('shell', 'ls')).toThrow(PermissionError)
  })

  it('throws PermissionError when token is in deny even if in allow', () => {
    const check = makePermissionChecker({ allow: ['fs.read:**'], deny: ['fs.read:/etc/**'] })
    expect(() => check('fs.read', '/etc/passwd')).toThrow(PermissionError)
  })

  it('PermissionError carries capability, value, and message', () => {
    const check = makePermissionChecker({ allow: [], deny: [] })
    let err
    try { check('shell', 'rm -rf') } catch (e) { err = e }
    expect(err).toBeInstanceOf(PermissionError)
    expect(err.capability).toBe('shell')
    expect(err.value).toBe('rm -rf')
    expect(err.message).toContain("'shell:rm -rf' is not permitted.")
  })

  it('wildcard allow passes any matching path', () => {
    const check = makePermissionChecker({ allow: ['fs.read:*'], deny: [] })
    expect(() => check('fs.read', 'package.json')).not.toThrow()
    expect(() => check('fs.read', 'tsconfig.json')).not.toThrow()
  })
})
