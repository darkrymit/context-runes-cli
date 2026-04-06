import * as md from './md.js'
import * as treeUtils from './tree.js'
import { createFsUtils } from './fs.js'
import { createShellUtils } from './shell.js'

function section(name, data, { title, attrs } = {}) {
  return { name, title, attrs: attrs ?? {}, data }
}

/**
 * @param {string} dir - project root directory (cwd for rune)
 * @param {Function|null} checkPermission - permission checker; null = local rune (ungated)
 */
export function createUtils(dir, checkPermission = null) {
  return {
    md,
    tree: treeUtils,
    section,
    fs: createFsUtils(dir, checkPermission),
    shell: createShellUtils(dir, checkPermission),
  }
}
