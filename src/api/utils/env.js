import { readFileSync } from 'node:fs'
import { parse } from 'dotenv'
import micromatch from 'micromatch'
import { parseEnvPattern } from '../../isolation/permissions-env.js'

function loadFile(dir, src, cache) {
  if (cache.has(src)) return cache.get(src)
  let data = {}
  try { data = parse(readFileSync(`${dir}/${src}`, 'utf8')) } catch {}
  cache.set(src, data)
  return data
}

export function createEnvUtils(dir, checkPermission, permissions) {
  const fileCache = new Map()

  function resolve(key) {
    for (const pattern of permissions.allow) {
      if (!pattern.startsWith('env:')) continue
      const { sources, keyPattern } = parseEnvPattern(pattern)
      if (!micromatch.isMatch(key, keyPattern)) continue
      for (const src of sources) {
        try {
          if (checkPermission) checkPermission('env', `${src}:${key}`)
        } catch {
          continue
        }
        const data = src === 'process' ? process.env : loadFile(dir, src, fileCache)
        if (Object.hasOwn(data, key)) return data[key]
      }
    }
    return undefined
  }

  return {
    get: (key, fallback = undefined) => resolve(key) ?? fallback,
    has: (key) => resolve(key) !== undefined,
  }
}
