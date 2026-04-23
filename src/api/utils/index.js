import * as md from './md.js'
import * as treeUtils from './tree.js'
import { createFsUtils } from './fs.js'
import { createShellUtils } from './shell.js'
import { createJsonUtils } from './json.js'
import { createFetchUtils } from './fetch.js'

function section(name, data, { title, attrs } = {}) {
  return { name, title, attrs: attrs ?? {}, data }
}

/**
 * @param {string} dir - project root directory (cwd for rune)
 * @param {Function|null} checkPermission - permission checker; null = local rune (ungated)
 * @param {string|null} pluginDir - plugin root dir; enables @plugin/ paths
 */
export function createUtils(dir, checkPermission = null, pluginDir = null) {
  const fs = createFsUtils(dir, checkPermission, pluginDir)
  return {
    md,
    tree: treeUtils,
    section,
    fs,
    shell: createShellUtils(dir, checkPermission),
    json:  createJsonUtils(dir, fs),
    fetch: createFetchUtils(checkPermission),
  }
}
