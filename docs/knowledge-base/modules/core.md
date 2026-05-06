---
tags: [module]
---
# core

> Minimal shared domain: `loadConfig` (synchronous config loader) and `CircularRuneError` (thrown on recursive rune calls).

**Source:** `src/core/`
**Submodules:** none (flat module)
**Related:** [[modules/rune]], [[modules/plugin]], [[modules/template]]

## Overview

`core` is intentionally minimal — it exists to give `rune/resolver.js`, `plugin/`, and `template/` a shared home for config loading and error types without creating import cycles between those modules. It has no domain logic of its own.

`loadConfig(dir)` reads `.crunes/config.json` from the given project root and returns the parsed object. `CircularRuneError` is thrown by `runRune` when the `_callStack` already contains the key being resolved.

## Key Decisions

- **Synchronous `readFileSync` in `loadConfig`:** All callers invoke `loadConfig` once at the start of a command, before any async rune work. Using sync I/O keeps call sites simple (no `await`) and makes errors surface immediately at the top of the call stack. If config is missing, the synchronous `ENOENT` propagates directly.

- **No config caching:** Every `loadConfig(dir)` call re-reads from disk. This is intentional — config is small, disk I/O at startup is cheap, and caching would require cache invalidation logic that would complicate the module. In tests, it means config changes between calls without process restart.

- **`CircularRuneError` formats the chain in the constructor:** The message is `Circular rune call: ${chain.join(' → ')}` (e.g. `Circular rune call: release → m → release`). The raw `chain` array is not stored as a property — only the formatted message string exists. If code needs to inspect individual keys, it must parse the message.

## Gotchas & Debugging

- **`loadConfig` does not validate the config schema:** It calls `JSON.parse(readFileSync(..., 'utf8'))` and returns the result. Fields `runes`, `plugins`, `permissions`, `vars`, and `templates` may all be absent. Every consumer that reads these fields must use `?? {}` or `?? []` defaults — this is consistently done in the codebase but easy to miss when adding a new consumer.

- **`loadConfig` throws on missing config:** There is no fallback to an empty config — if `.crunes/config.json` does not exist, `readFileSync` throws `ENOENT`. `commands/use.js` wraps this in try/catch and exits with a helpful message. Callers that do not wrap it will propagate to the top-level uncaught exception handler.

- **The config path is always relative to `dir`:** `loadConfig` always reads `join(dir, '.crunes', 'config.json')`. There is no mechanism to pass a path to a specific file, no environment variable override, and no search-up-the-directory-tree logic.
