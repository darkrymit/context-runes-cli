import micromatch from 'micromatch'
import { matchFetchPermission } from './permissions-http.js'

export class PermissionError extends Error {
  constructor(capability, value) {
    super(`'${capability}:${value}' is not permitted.`)
    this.name = 'PermissionError'
    this.capability = capability
    this.value = value
  }
}

function normalizePermission(perm) {
  if (perm.startsWith('fs.read:') || perm.startsWith('fs.exists:') || perm.startsWith('fs.glob:')) {
    const [cap, ...rest] = perm.split(':')
    const val = rest.join(':')
    if (
      !val.startsWith('./') &&
      !val.startsWith('../') &&
      !val.startsWith('@plugin/') &&
      !val.startsWith('~/') &&
      !val.startsWith('/') &&
      !/^[a-zA-Z]:/.test(val) // Windows absolute path
    ) {
      return `${cap}:./${val}`
    }
  }
  return perm
}

/**
 * Compute effective allow/deny from plugin.json permissions + optional project override.
 *
 * allow replaces  — project allow fully overrides plugin allow.
 * deny  combines  — project deny merges with plugin deny; a denial at any level is permanent.
 */
export function computeEffectivePermissions(pluginPerms, projectPerms) {
  const pluginAllow = (pluginPerms?.allow ?? []).map(normalizePermission)
  const pluginDeny  = (pluginPerms?.deny ?? []).map(normalizePermission)
  return {
    allow: (projectPerms?.allow ?? pluginAllow).map(normalizePermission),
    deny:  [...pluginDeny, ...(projectPerms?.deny ?? []).map(normalizePermission)],
  }
}

/**
 * Returns a checkPermission(capability, value) function that throws PermissionError
 * if the request is not in effective.allow or is in effective.deny.
 */
export function makePermissionChecker(effective) {
  return function checkPermission(capability, value) {
    if (capability === 'fetch') {
      const allowed = effective.allow.some(p => matchFetchPermission(value, p))
      const denied  = effective.deny.length > 0 && effective.deny.some(p => matchFetchPermission(value, p))
      if (!allowed || denied) throw new PermissionError(capability, value)
      return
    }
    const token   = `${capability}:${value}`
    const allowed = micromatch.isMatch(token, effective.allow)
    const denied  = effective.deny.length > 0 && micromatch.isMatch(token, effective.deny)
    if (!allowed || denied) throw new PermissionError(capability, value)
  }
}
