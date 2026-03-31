# @darkrymit/context-runes

CLI tool for managing and querying context-runes enrichers. Part of the [context-runes](https://github.com/darkrymit/context-runes) ecosystem.

## Installation

```bash
npm install -g @darkrymit/context-runes
```

Requires Node.js ≥ 20.

## Commands

```
crunes init                    Create .context-runes/config.json in the current project
crunes create [key]            Scaffold a new enricher and register it in config
crunes query <key> [args...]   Query an enricher and print its output
crunes run <key> [args...]     Alias for query --format md
crunes list                    List all registered enricher keys
crunes validate                Check that all registered enrichers exist and export generate()
```

**Global flags:**

```
-n, --no-interactive    Disable interactive prompts (also auto-detected in non-TTY environments)
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
crunes create docs        # scaffolds .context-runes/enrichers/docs.js
crunes query docs         # runs the enricher and prints output
```

## Enricher API

An enricher is an ES module that exports a `generate` function:

```js
export function generate(dir, args, utils) { ... }
```

| Parameter | Description |
|---|---|
| `dir` | Absolute path to the project root |
| `args` | `string[]` parsed from `$key(arg1, arg2)` tokens |
| `utils` | Injected utilities — `utils.md`, `utils.tree`, `utils.section` |

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
