---
tags: [module]
---
# shared

> Cross-cutting output utilities: `render.js` converts Section data to CLI strings; `output.js` is the global logger with plain/color modes.

**Source:** `src/shared/`
**Submodules:** none (flat module)
**Related:** all modules (no domain coupling)

## Overview

`shared` has no domain knowledge — it knows nothing about runes, plugins, or config. It provides two utilities: a renderer for Section data and a global logger. All feature modules can import it without creating cycles.

`render.js` has two public functions: `render(data)` converts a raw data object (`{ type, ... }`) to a plain string; `renderSection(section)` formats a full Section (header + attrs + fenced content) as CLI output. `output.js` provides `configure({ plain, verbose })` and the `output` object (`success`, `error`, `info`, `warn`, `header`).

## Concepts

**Section rendering format:** `renderSection` produces:
```
## {section.title or section.name}
[attr: value] [attr: value]
```md
{content}
```
```
The `## ` header uses `section.title` if present, falls back to `section.name`, falls back to `## (no title)`. Attrs are emitted on one line as `[key: value]` pairs only if `section.attrs` is non-empty. Markdown content is always wrapped in triple-backtick `md` fences.

**`renderTree` column alignment:** `renderTree` formats tree nodes as `root.name.padEnd(12) + root.description`, then appends children with box-drawing connectors (`├── `, `└── `, `│   `, `    `). The name column is always 12 characters wide.

**`configure()` is global:** `configure({ plain, verbose })` sets two module-level variables (`_plain`, `isVerbose`) and, if `plain` is true, sets `chalk.level = 0` on the chalk singleton. This affects every chalk call in the entire process — not just in `output.js`. It is called once per CLI invocation from the `preAction` hook in `program.js`.

## Key Decisions

- **Markdown content wrapped in ` ```md ` fences, always:** When `section.data.type === 'markdown'`, `renderSection` wraps the content in ` ```md\n...\n``` `. This is intentional — it tells AI/pipe consumers that the enclosed text is markdown source, not prose output. The fence does not change in `--plain` mode (chalk is disabled, but the fence remains).

- **`chalk.level = 0` instead of a plain-mode guard on each call:** Setting `chalk.level = 0` globally is simpler than threading a `plain` boolean through every logging call site. The trade-off is that any chalk usage introduced in a new module automatically respects `--plain` without any additional code.

## Gotchas & Debugging

- **`render(data)` returns `null` for unknown data types:** If `data.type` is neither `'tree'` nor `'markdown'`, `render` returns `null` silently. `renderSection` will produce a section with a header and attrs but no body. Check `section.data.type` if a section renders empty.

- **`renderSection` returns `null` for fully empty sections:** If a section has no title/name AND no renderable data, `parts.filter(Boolean).join('\n')` produces an empty string (falsy). The `use.js` handler filters these with `.filter(Boolean)`. This means a rune can return a Section with no title and no data and it silently disappears from output.

- **`renderTree` pads node names to exactly 12 characters:** Names longer than 12 characters push the description column — description alignment breaks for long module names. This is cosmetic but affects the layout output of the `m` rune.

- **`isVerbose` is exported as a mutable binding:** `import { isVerbose } from '../../shared/output.js'`. Callers that capture `isVerbose` at import time into a local `const` will see the initial value (`false`), not the value after `configure()` runs. Always read `isVerbose` as a live import reference, not a cached local.
