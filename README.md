# @darkrymit/context-runes

CLI tool for managing and querying context runes. Part of the [context-runes](https://github.com/darkrymit/context-runes) ecosystem.

## Installation

```bash
npm install -g @darkrymit/context-runes
```

Requires Node.js ≥ 20.

## Commands

```
crunes init                    Create .context-runes/config.json in the current project
crunes create [key]            Scaffold a new rune and register it in config
crunes query <key> [args...]   Query a rune and print its output
crunes run <key> [args...]     Alias for query --format md
crunes list                    List all registered rune keys
crunes validate                Check that all registered runes exist and export generate()
```

**Plugin management:**

```
crunes plugin install <marketplace>@<plugin>   Install a plugin from a configured marketplace
crunes plugin uninstall <name>                 Uninstall a plugin
crunes plugin list                             List installed plugins
crunes plugin update [name]                    Update one or all installed plugins
crunes plugin enable <name>                    Enable a disabled plugin
crunes plugin disable <name>                   Disable a plugin without uninstalling it
```

**Marketplace sources:**

```
crunes marketplace add <url>       Add a marketplace source (URL or local path)
crunes marketplace remove <url>    Remove a marketplace source
crunes marketplace list            List configured sources
crunes marketplace search <query>  Search for plugins across all sources
```

**Global flags:**

```
-y, --yes     Assume yes to all prompts (also auto-detected in non-TTY environments)
--plain       Plain output: no colors, no box-drawing — optimised for AI/pipe use
```

**Output formats** (for `query` and `list`):

```
--format md     Human-readable markdown output (default)
--format json   Machine-readable JSON — used by the Claude Code plugin hook
```

## Project Setup

```bash
cd your-project
crunes init               # creates .context-runes/config.json
crunes create docs        # scaffolds .context-runes/runes/docs.js
crunes query docs         # runs the rune and prints output
```

## Rune API

A rune is an ES module that exports a `generate` function:

```js
export async function generate(dir, args, utils, opts) { ... }
```

| Parameter | Description |
|---|---|
| `dir` | Absolute path to the project root |
| `args` | `string[]` parsed from `$key(arg1, arg2)` tokens |
| `utils` | Injected utilities — see below |
| `opts` | Config options passed through from the CLI |

### Return values

**Single section (Shape A):**

```js
return { type: 'markdown', content: '...' };
// or
return { type: 'tree', root: utils.tree.node('src', 'Source root') };
```

**Multiple sections (Shape B):**

```js
return [
  utils.section('context', { type: 'markdown', content: '...' }, { title: 'Setup', attrs: { id: 'setup' } }),
  utils.section('context', { type: 'tree', root: ... }, { title: 'Structure', attrs: { id: 'structure' } }),
];
```

### `utils.md` — Markdown builders

| Function | Output |
|---|---|
| `md.h1(text)` | `# text\n` |
| `md.h2(text)` | `## text\n` |
| `md.h3(text)` | `### text\n` |
| `md.bold(text)` | `**text**` |
| `md.italic(text)` | `_text_` |
| `md.code(text)` | `` `text` `` |
| `md.codeBlock(text, lang?)` | fenced code block |
| `md.ul(items)` | unordered list |
| `md.ol(items)` | ordered list |
| `md.link(text, url)` | `[text](url)` |
| `md.table(headers, rows)` | GFM table |

### `utils.tree` — Tree builders

```js
utils.tree.node(name, description, children?)
// → { name, description, children: [] }

utils.tree.format(root, { style: 'tree' | 'list', bullet: '-' | '*' | '+' }?)
// → formatted string
```

### `utils.section` — Section builder

```js
utils.section(name, data, { title?, attrs? }?)
// → { name, title, attrs, data }
```

### `utils.fs` — Filesystem access

All paths are relative to `dir` and are sandboxed to the project root.

```js
await utils.fs.read(relPath, { throw: true }?)
// → string | null   (null only when throw: false and file missing)

await utils.fs.exists(relPath)
// → boolean

await utils.fs.glob(pattern, { ignore?: string[], onlyDirectories?: boolean }?)
// → string[]   (forward-slash paths)
```

### `utils.shell` — Shell commands

```js
await utils.shell(cmd, { throw: true, trim: true, timeout: 30000, env }?)
// → string (stdout)          when trim: true (default)
// → { stdout, stderr, exitCode }  when trim: false
```

Throws `ShellError` (with `.stdout`, `.stderr`, `.exitCode`) on non-zero exit unless `throw: false`.

> **Plugin runes:** `utils.fs` and `utils.shell` are permission-gated. Allowed patterns are declared in `plugin.json` and shown during consent. Local runes have unrestricted access.

## Plugins

Plugins extend context-runes with third-party runes. They run inside a V8 isolate (via `isolated-vm`) with explicit permission grants.

### Installing a plugin

```bash
# Add a marketplace source first
crunes marketplace add https://example.com/marketplace.json
# or a local path for development
crunes marketplace add ./my-plugin/.context-runes-plugin

# Install from the marketplace
crunes plugin install my-marketplace@my-plugin
```

### Using a plugin rune

Plugin runes are addressed as `pluginName:runeKey`:

```bash
crunes query my-plugin:some-rune
```

### Plugin manifest (`plugin.json`)

Plugins declare their runes and permissions in `.context-runes-plugin/plugin.json`:

```json
{
  "format": "1",
  "name": "my-plugin",
  "version": "1.0.0",
  "dependencies": { "semver": "^7.0.0" },
  "runes": {
    "some-rune": {
      "permissions": {
        "allow": ["fs.read:**", "shell:git log *"]
      }
    }
  }
}
```

### Project-level permission overrides

Narrow or extend a plugin's permissions in `.context-runes/config.json`:

```json
{
  "plugins": ["my-plugin"],
  "permissions": {
    "my-plugin:some-rune": {
      "allow": ["fs.read:src/**"],
      "deny": ["shell:*"]
    }
  }
}
```

## CLI Output (`--format md`)

Each section renders as:

```
## {title or name}
[k: v] [k: v]            ← omitted if no attrs
{rendered data}
```

Sections are separated by a blank line.

## License

MIT — [Tamerlan Hurbanov (DarkRymit)](https://github.com/darkrymit)
