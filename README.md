# @darkrymit/crunes-cli

CLI tool for managing and querying crunes. Part of the [crunes](https://github.com/darkrymit/context-runes) ecosystem.

## Installation

```bash
npm install -g @darkrymit/crunes-cli
```

Requires Node.js ≥ 20.

## Commands

```
crunes init                    Create .crunes/config.json in the current project
crunes create [key]            Scaffold a new rune and register it in config
crunes use <key> [-a <key>...] Use one or more runes and output the result (use --fail-fast to stop on error)
crunes bench [key]             Time rune execution and report performance (use --runs <n> to average)
crunes list                    List all registered runes
crunes version                 Print the installed version and check for updates
```

**Template management:**

```
crunes template list [source]  List available templates
crunes template use <key>      Copy a template into the project as a new rune
crunes template create [name]  Scaffold a new template file
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
-v, --version         Print version number (or --verbose / -v if a command is present)
-y, --yes             Assume yes to all prompts (also auto-detected in non-TTY environments)
-p, --plain           Plain output: no colors, no box-drawing — optimised for AI/pipe use
    --cwd <path>      Project root to use instead of the current working directory
    --verbose, -v     Print full stack traces on errors (contextual: -v acts as --verbose when a command is given)
```

**Output formats** (for `use` and `list`):

```
--format md     Human-readable markdown output (default)
--format json   Machine-readable JSON — used by the Claude Code plugin hook
```

## Project Setup

```bash
cd your-project
crunes init               # creates .crunes/config.json
crunes create docs        # scaffolds .crunes/runes/docs.js
crunes use docs           # runs the rune and prints output
crunes use docs -a api=v2 # runs multiple runes in batch
```

## Key Syntax

Commands that accept a `<key>` (like `crunes use` and `crunes bench`) support the following syntax:

`[source:]name[=arg1,arg2][::section1,section2]`

- `name`: The name of the rune (auto-resolved from project config first, then plugins).
- `source:`: Forces resolution from a specific source.
  - `local:name` resolves strictly from `.crunes/config.json`.
  - `my-plugin:name` resolves strictly from an installed plugin.
- `=arg1,arg2`: Passes arguments to the rune (available as `args` in the API).
- `::section1,section2`: Filters the output to only return specific sections.

## Rune API

A rune is an ES module that exports a `generate` function:

```js
export async function generate(dir, args, utils, opts) { ... }
```

| Parameter | Description |
|---|---|
| `dir` | Absolute path to the project root |
| `args` | `string[]` parsed from `$key=arg1,arg2` tokens |
| `utils` | Injected utilities — see below |
| `opts` | Config options (e.g. `opts.sections` for performance hinting) |

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

Plugins extend crunes with third-party runes. They run inside a V8 isolate (via `isolated-vm`) with explicit permission grants.

### Installing a plugin

```bash
# Add a marketplace source first
crunes marketplace add https://example.com/marketplace.json
# or a local path for development
crunes marketplace add ./my-plugin/.crunes-plugin

# Install from the marketplace
crunes plugin install my-marketplace@my-plugin
```

### Using a plugin rune

Plugin runes are addressed as `pluginName:runeKey`:

```bash
crunes use my-plugin:some-rune
```

### Plugin manifest (`plugin.json`)

Plugins declare their runes and permissions in `.crunes-plugin/plugin.json`:

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

Narrow or extend a plugin's permissions in `.crunes/config.json`:

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

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

## License

MIT — [Tamerlan Hurbanov (DarkRymit)](https://github.com/darkrymit)
