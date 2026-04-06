/**
 * Parses a unified rune key token into its components.
 *
 * Format: key[=arg1,arg2][::section1,section2]
 *   ':'  — plugin key separator (part of the key, e.g. my-plugin:runeKey)
 *   '='  — args separator
 *   '::' — section filter separator (double colon only)
 *
 * @param {string} token
 * @returns {{ key: string, args: string[], sections: string[] | null }}
 */
export function parseKeyToken(token) {
  let rest = token
  let sections = null

  // Split on first '::' for section filter
  const dblColonIdx = rest.indexOf('::')
  if (dblColonIdx !== -1) {
    const sectionStr = rest.slice(dblColonIdx + 2)
    const parsed = sectionStr.split(',').map(s => s.trim()).filter(Boolean)
    sections = parsed.length > 0 ? parsed : null
    rest = rest.slice(0, dblColonIdx)
  }

  // Split on first '=' for args
  let key
  let args = []
  const eqIdx = rest.indexOf('=')
  if (eqIdx !== -1) {
    key = rest.slice(0, eqIdx)
    const argStr = rest.slice(eqIdx + 1)
    args = argStr.split(',').map(a => a.trim()).filter(Boolean)
  } else {
    key = rest
  }

  return { key, args, sections }
}
