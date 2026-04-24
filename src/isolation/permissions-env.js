import micromatch from 'micromatch'

export function parseEnvPattern(pattern) {
  const body       = pattern.slice(4)
  const lastColon  = body.lastIndexOf(':')
  const sourcesStr = body.slice(0, lastColon)
  const keyPattern = body.slice(lastColon + 1)
  return { sources: sourcesStr.split(','), keyPattern }
}

// value: 'source:key' e.g. 'process:TOKEN' or '.env:API_KEY'
export function matchEnvPermission(value, pattern) {
  if (!pattern.startsWith('env:')) return false
  const colonIdx = value.indexOf(':')
  if (colonIdx === -1) return false
  const source = value.slice(0, colonIdx)
  const key    = value.slice(colonIdx + 1)
  const { sources, keyPattern } = parseEnvPattern(pattern)
  return sources.includes(source) && micromatch.isMatch(key, keyPattern)
}
