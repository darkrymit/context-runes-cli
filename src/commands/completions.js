import fs from 'node:fs'
import fsPromises from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

// ─── Constants ───────────────────────────────────────────────────────────────

const TOP_LEVEL_CMDS = [
  'use', 'check', 'bench', 'list', 'init', 'create',
  'plugin', 'template', 'marketplace', 'completions',
  'version', 'doctor',
]

const PLUGIN_SUBS = ['install', 'uninstall', 'list', 'update', 'enable', 'disable', 'create']
const PLUGIN_NAME_SUBS = ['uninstall', 'enable', 'disable', 'update']
const TEMPLATE_SUBS = ['list', 'use', 'create']
const MARKETPLACE_SUBS = ['add', 'remove', 'list', 'search', 'update', 'browse']
const COMPLETION_SUBS = ['bash', 'zsh', 'fish', 'powershell', 'install']
const GLOBAL_FLAG_WITH_VALUE = ['--cwd']
const GLOBAL_FLAGS = ['--yes', '-y', '--plain', '-p', '--verbose']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractCwd(tokens) {
  const idx = tokens.indexOf('--cwd')
  if (idx !== -1 && idx + 1 < tokens.length) return path.resolve(tokens[idx + 1])
  return process.cwd()
}

function getCommandTokens(tokens) {
  const result = []
  let i = 1 // skip 'crunes'
  const lastIdx = tokens.length - 1
  while (i < tokens.length) {
    if (i < lastIdx && GLOBAL_FLAG_WITH_VALUE.includes(tokens[i])) {
      i += 2
    } else if (i < lastIdx && GLOBAL_FLAGS.includes(tokens[i])) {
      i += 1
    } else {
      result.push(tokens[i])
      i += 1
    }
  }
  return result
}

function loadRuneKeys(dir) {
  try {
    const configPath = path.join(dir, '.context-runes', 'config.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    return Object.keys(config.runes ?? {})
  } catch {
    return []
  }
}

function loadPluginNames() {
  try {
    const pluginsPath = path.join(os.homedir(), '.context-runes', 'plugins.json')
    const registry = JSON.parse(fs.readFileSync(pluginsPath, 'utf8'))
    return Object.keys(registry.plugins ?? {})
  } catch {
    return []
  }
}

function logDebug(err) {
  if (process.env.CRUNES_COMPLETION_DEBUG !== '1') return
  try {
    const line = `[${new Date().toISOString()}] ${err?.stack ?? err}\n`
    fs.appendFileSync('/tmp/crunes-completion.log', line)
  } catch { /* ignore */ }
}

// ─── Core resolver ────────────────────────────────────────────────────────────

export function resolveCompletions(tokens, { cwd } = {}) {
  const resolvedCwd = cwd ?? extractCwd(tokens)
  const cmds = getCommandTokens(tokens)

  if (cmds.length <= 1) return TOP_LEVEL_CMDS

  const sub = cmds[0]
  const prev = cmds[cmds.length - 2]

  if (prev === '--format') return ['md', 'json']
  if (prev === '--cwd') return []

  if ((sub === 'use' || sub === 'check' || sub === 'bench') && cmds.length === 2) {
    return loadRuneKeys(resolvedCwd)
  }

  if (sub === 'plugin') {
    if (cmds.length === 2) return PLUGIN_SUBS
    const pluginSub = cmds[1]
    if (PLUGIN_NAME_SUBS.includes(pluginSub) && cmds.length === 3) return loadPluginNames()
    return []
  }

  if (sub === 'template' && cmds.length === 2) return TEMPLATE_SUBS
  if (sub === 'marketplace' && cmds.length === 2) return MARKETPLACE_SUBS
  if (sub === 'completions' && cmds.length === 2) return COMPLETION_SUBS

  return []
}

// ─── Shell handlers ───────────────────────────────────────────────────────────

function outputCandidates(candidates) {
  if (candidates.length > 0) process.stdout.write(candidates.join('\n') + '\n')
}

export function zshHandler(words) {
  try {
    const tokens = Array.isArray(words) ? words : []
    outputCandidates(resolveCompletions(tokens))
  } catch (err) {
    logDebug(err)
  }
}

export function fishHandler(words) {
  try {
    const tokens = Array.isArray(words) ? words : []
    outputCandidates(resolveCompletions(tokens))
  } catch (err) {
    logDebug(err)
  }
}

export function powershellHandler(elements) {
  try {
    const tokens = Array.isArray(elements) ? elements : []
    outputCandidates(resolveCompletions(tokens))
  } catch (err) {
    logDebug(err)
  }
}

export function bashHandler() {
  try {
    const compLine = process.env.COMP_LINE ?? ''
    const compPoint = parseInt(process.env.COMP_POINT ?? String(compLine.length), 10)
    const partial = compLine.slice(0, compPoint)
    const tokens = partial.split(/\s+/).filter((t, i, arr) => i < arr.length - 1 || t !== '')
    if (partial.endsWith(' ')) tokens.push('')
    outputCandidates(resolveCompletions(tokens))
  } catch (err) {
    logDebug(err)
  }
}

// ─── Installation hooks ───────────────────────────────────────────────────────

const HOOKS = {
  bash:       "complete -C 'crunes completions bash' crunes\n",
  zsh:        "compdef '_comps=(\"${(@f)$(crunes completions zsh \"${(@)words}\")}\"); compadd -a _comps' crunes\n",
  fish:       "complete -c crunes -f -a \"(crunes completions fish (commandline -opc))\"\n",
  powershell: "Register-ArgumentCompleter -Native -CommandName crunes -ScriptBlock { param($w,$ast,$pos); crunes completions powershell $ast.CommandElements }\n",
}

function defaultProfilePath(shell) {
  const home = os.homedir()
  if (shell === 'bash')       return path.join(home, '.bashrc')
  if (shell === 'zsh')        return path.join(home, '.zshrc')
  if (shell === 'fish')       return path.join(home, '.config', 'fish', 'config.fish')
  if (shell === 'powershell') {
    return process.platform === 'win32'
      ? path.join(home, 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1')
      : path.join(home, '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1')
  }
}

export async function installHandler(shell, { profilePath } = {}) {
  const hook = HOOKS[shell]
  if (!hook) throw new Error(`Unknown shell: ${shell}. Supported: bash, zsh, fish, powershell`)

  const target = profilePath ?? defaultProfilePath(shell)
  await fsPromises.mkdir(path.dirname(target), { recursive: true })

  let existing = ''
  try {
    existing = await fsPromises.readFile(target, 'utf8')
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }

  const hookLine = hook.trim()
  if (existing.includes(hookLine)) {
    console.log(`crunes completions already present in ${target}`)
    return
  }

  await fsPromises.appendFile(target, (existing.length ? '\n' : '') + hook)
  console.log(`crunes completions installed in ${target}`)
  console.log(`Restart your shell or run: source ${target}`)
}
