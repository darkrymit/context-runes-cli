import * as md from './md.js'
import * as treeUtils from './tree.js'
import { createFsUtils } from './fs.js'
import { createShellUtils } from './shell.js'
import { createJsonUtils } from './json.js'
import { createFetchUtils } from './fetch.js'
import { createEnvUtils } from './env.js'
import { createVarsUtils } from './vars.js'

function section(name, data, { title, attrs } = {}) {
  return { name, title, attrs: attrs ?? {}, data }
}

export function createUtils(dir, checkPermission = null, pluginDir = null, permissions = { allow: [], deny: [] }, vars = {}) {
  const fs = createFsUtils(dir, checkPermission, pluginDir)
  return {
    md,
    tree: treeUtils,
    section,
    fs,
    shell: createShellUtils(dir, checkPermission),
    json:  createJsonUtils(dir, fs),
    fetch: createFetchUtils(checkPermission),
    env:   createEnvUtils(dir, checkPermission, permissions),
    vars:  createVarsUtils(vars),
  }
}
