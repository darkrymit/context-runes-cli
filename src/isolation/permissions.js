import micromatch from 'micromatch'

export class PermissionError extends Error {
  constructor(capability, value) {
    super(`'${capability}:${value}' is not permitted.`)
    this.name = 'PermissionError'
    this.capability = capability
    this.value = value
  }
}

/**
 * Compute effective allow/deny from plugin.json permissions + optional project override.
 *
 * allow replaces  — project allow fully overrides plugin allow.
 * deny  combines  — project deny merges with plugin deny; a denial at any level is permanent.
 */
export function computeEffectivePermissions(pluginPerms, projectPerms) {
  const pluginAllow = pluginPerms?.allow ?? []
  const pluginDeny  = pluginPerms?.deny ?? []
  return {
    allow: projectPerms?.allow ?? pluginAllow,
    deny:  [...pluginDeny, ...(projectPerms?.deny ?? [])],
  }
}

/**
 * Returns a checkPermission(capability, value) function that throws PermissionError
 * if the request is not in effective.allow or is in effective.deny.
 */
export function makePermissionChecker(effective) {
  return function checkPermission(capability, value) {
    const token = `${capability}:${value}`
    const allowed = micromatch.isMatch(token, effective.allow)
    const denied  = effective.deny.length > 0 && micromatch.isMatch(token, effective.deny)
    if (!allowed || denied) throw new PermissionError(capability, value)
  }
}
