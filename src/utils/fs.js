import fs from 'node:fs/promises'
import path from 'node:path'
import { glob } from 'tinyglobby'

function stripBom(str) {
  return str.charCodeAt(0) === 0xfeff ? str.slice(1) : str
}

function assertInsideDir(root, abs) {
  const resolvedRoot = path.resolve(root)
  if (abs !== resolvedRoot && !abs.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Path traversal denied: path is outside project root`)
  }
}

export function createFsUtils(dir, checkPermission) {
  return {
    async read(relPath, { throw: shouldThrow = true } = {}) {
      if (checkPermission) checkPermission('fs.read', relPath)
      const abs = path.resolve(dir, relPath)
      assertInsideDir(dir, abs)
      try {
        return stripBom(await fs.readFile(abs, 'utf8'))
      } catch (err) {
        if (!shouldThrow && err.code === 'ENOENT') return null
        throw err
      }
    },

    async exists(relPath) {
      if (checkPermission) checkPermission('fs.read', relPath)
      const abs = path.resolve(dir, relPath)
      assertInsideDir(dir, abs)
      try {
        await fs.access(abs)
        return true
      } catch {
        return false
      }
    },

    async glob(pattern, { ignore = [], onlyDirectories = false } = {}) {
      if (checkPermission) checkPermission('fs.glob', pattern)
      const results = await glob(pattern, {
        cwd: dir,
        ignore,
        onlyFiles: !onlyDirectories,
        onlyDirectories,
      })
      return results.map(r => r.replace(/\\/g, '/'))
    },
  }
}
