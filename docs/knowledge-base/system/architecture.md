---
tags: [system]
---
# Architecture

> Feature-first module layout, sandboxed rune execution via isolated-vm, and a two-layer storage model separating the global plugin registry from per-project config.

## Technology Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20, ESM |
| Bundler | esbuild (single output `dist/cli.js`) |
| CLI framework | Commander.js |
| Sandbox | isolated-vm (V8 Isolate per rune invocation) |
| Test | Vitest |
| Deps | micromatch, fast-glob, chalk, @clack/prompts |

## Module Map

| Module | Purpose |
|---|---|
| `cli/` | Entry point bootstrap, Commander setup, general commands (version, doctor, completions) |
| `core/` | `loadConfig`, `CircularRuneError` — shared types with no domain logic |
| `marketplace/` | Marketplace source URL management and cached plugin index |
| `plugin/` | Plugin registry, install, uninstall, enable, disable, consent |
| `rune/` | Key resolution, isolated-vm execution, utils API, permissions |
| `shared/` | `render.js`, `output.js` — cross-cutting utilities with no domain coupling |
| `template/` | Rune template listing and scaffolding |

## Key Design Principles

### Isolated-VM sandbox

Every rune runs in a fresh V8 isolate via `isolated-vm`. The isolate cannot access Node builtins directly — all I/O goes through the `utils` bridge: host-side async functions injected as `$__utils_fs_read`, `$__utils_shell`, etc. (References, not ExternalCopy, because callbacks cannot be serialized). The isolate is created and torn down per invocation; there is no reuse between `crunes use` calls.

### Feature-first module layout

Each directory under `src/` owns everything for one feature — commands, domain logic, and sub-modules. Infrastructure sub-modules (`rune/api`, `rune/isolation`, `rune/permissions`) live inside the feature that owns them, not at the top level. This keeps related code co-located and avoids a shared infrastructure layer that creates cycles.

### Two-layer storage

- **Global store** (`~/.crunes/`) — installed plugins, marketplace cache, pnpm packages. Managed by `plugin/store.js`. Shared across all projects on the machine.
- **Project config** (`.crunes/config.json`) — registered runes, enabled plugins, permission overrides, vars. Per-project. Loaded synchronously via `core/config.js`.

### esbuild single bundle

`npm run build` produces a single `dist/cli.js`. All `src/` is bundled in. The only dynamic `import()` calls at runtime are Commander action handlers (lazy-loaded to keep startup fast). Rune files (`.crunes/runes/*.js`, plugin runes) are NOT bundled — they are loaded at runtime by the isolate from disk.

`dist/cli.js` is committed to git and published on npm. Never hand-edit it. Rebuild with `npm run build` after any `src/` change before testing.

### Node 20+ snapshot workaround

`isolated-vm` is incompatible with V8's startup snapshot. `cli.js` detects Node ≥ 20 and re-spawns itself with `--no-node-snapshot` via `spawnSync` if the flag is absent from `process.execArgv`. The re-spawn happens before isolated-vm is ever loaded (it is only imported lazily in `rune/commands/use.js`).

## Gotchas & Debugging

- **`dist/` must be rebuilt after `src/` changes:** Editing source files has no effect on CLI behavior until `npm run build` is run. Rune files (`.crunes/runes/`) are read from disk at runtime and do NOT require a rebuild.

- **The global store is always `~/.crunes/`:** `plugin/store.js` hard-codes `os.homedir()/.crunes`. There is no `XDG_DATA_HOME` or environment-variable override.

- **The Node re-spawn appears as a double process:** On Node 20+, every `crunes` invocation creates a parent that immediately exits and a child that does the real work. Process monitors, `strace`, or `ps` will show two processes briefly. All logs and errors come from the child.
