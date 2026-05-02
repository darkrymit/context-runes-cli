# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.4.5] - 2026-05-02

### Fixed
- Fixed update check URL and install instruction still pointing to `@darkrymit/context-runes`.
- Fixed `User-Agent` header in marketplace and install HTTP calls still using `context-runes-cli`.
- Fixed remaining `[context-runes]` log prefixes in the ACI hook wrapper.
- Fixed all interactive `intro()` prompts still displaying `context-runes` to users.
- Fixed `.crunes/config.json` rune path still referencing the old `.context-runes/` prefix.

### Changed
- Publish workflow: tag pattern narrowed to semver-only, `workflow_dispatch` added for manual triggering, concurrency guard added.

---

## [0.4.4] - 2026-05-02

### Changed
- Migrated package identity from `@darkrymit/context-runes` to `@darkrymit/crunes`.
- Project config folder renamed from `.context-runes/` to `.crunes/`.
- Plugin manifest folder renamed from `.context-runes-plugin/` to `.crunes-plugin/`.
- Global store path changed from `~/.context-runes` to `~/.crunes`.
- Isolate env variable renamed from `CONTEXT_RUNES_PLUGIN_ROOT` to `CRUNES_PLUGIN_ROOT`.
- Version history re-baselined from `1.x.x` to `0.x.x`.

---

## [0.4.3] - 2026-04-21

### Fixed
- Fixed `fs.glob` permission enforcement. Glob patterns are now canonicalized (ensuring a `./` prefix for relative paths) before being checked against the permission list, resolving a regression where `fs.glob` calls were incorrectly denied when using the normalized syntax.

---

## [0.4.2] - 2026-04-20

### Added
- Added automatic path normalization for filesystem permissions (`fs.read`, `fs.exists`, `fs.glob`). Permission declarations can now use either bare paths (e.g., `package.json`) or prefixed paths (e.g., `./package.json`); both are automatically mapped to the internal canonical form.

---

## [0.4.1] - 2026-04-20

### Fixed
- Extracted CLI program factory to `src/program.js` to enable isolated testing of command definitions and completion logic.
- Fixed shell completion handlers to correctly receive the program instance, resolving failures in `bash`, `zsh`, `fish`, and `powershell` tab-completion.
- Formatted completion choices to ensure consistent behavior across different shells.

---

## [0.4.0] - 2026-04-20

### Added
- Added `crunes completions` command group with shell-specific handlers for bash, zsh, fish, and PowerShell.
- Added `crunes completions install <shell>` to automatically append the completion hook to the appropriate shell profile (idempotent).
- Completion candidates dynamically include rune keys from the current project config and plugin names from the global registry.
- Added `@plugin/` path prefix support in `utils.fs` so plugin runes can read files relative to their own plugin directory.
- Added `~/` path prefix support in `utils.fs` to resolve paths relative to the user's home directory.

### Changed
- Refactored `src/cli.js` to lazy-load all command handlers via dynamic `import()` at action time, reducing startup overhead for commands that are not invoked.
- Reworked `utils.fs` permission token generation: paths are now canonicalized to `./`-relative form before being checked against the permission list, making permission declarations consistent regardless of how the path was passed.
- Plugin runes automatically receive `fs.read:@plugin/**` in their effective permission set.

---

## [0.3.12] - 2026-04-20

### Added
- Added `AGENTS.md` and symlinks (`GEMINI.md`, `CLAUDE.md`) to guide AI coding assistants on project architecture and release workflows.
- Improved the `release` context rune to dynamically monitor version synchronization across `package.json`, `package-lock.json`, and `src/cli.js`.

### Fixed
- Fixed CI workflow to correctly use `npm test` (Vitest) instead of Node's built-in test runner.
- Replaced the `prepare` lifecycle hook with `prepack` in `package.json` to avoid redundant builds during `npm install`.
- Synchronized internal CLI version with `package.json`.

---

## [0.3.11] - 2026-04-20

### Changed
- Optimized test suite to focus on API contracts: removed redundant prose assertions that duplicated snapshot coverage, merged overlapping `PermissionError` tests, and dropped trivial factory-function tests with no branching logic.

---

## [0.3.10] - 2026-04-19

### Changed
- Internal version bump for npm sync.

---

## [0.3.9] - 2026-04-17

### Fixed
- Fixed `isolated-vm` segmentation faults on macOS + Node 20+ by dynamically injecting `--no-node-snapshot`.

---

## [0.3.8] - 2026-04-17

### Added
- Added granular trace logging inside `isolated-vm` lifecycle to pinpoint macOS segfaults.

---

## [0.3.7] - 2026-04-17

### Added
- Hardened error catching and added `--verbose` trace logs around execution to debug silent crashes.

---

## [0.3.6] - 2026-04-17

### Added
- Added `--verbose` global flag to print full stack traces on rune failures.

---

## [0.3.5] - 2026-04-17

### Changed
- Version bump to synchronize npm release.

---

## [0.3.4] - 2026-04-17

### Fixed
- Updated documentation to accurately reflect the latest CLI argument syntax, key parsing, and global flags.

---

## [0.3.3] - 2026-04-17

### Fixed
- Fixed a bug causing `crunes create` to output a non-standard config shape.
- Fixed an `isolated-vm` relative module resolution issue that led to crashes in nested imports.

---

## [0.3.2] - 2026-04-17

### Changed
- Wrapped markdown sections in ` ```md ``` ` fenced blocks.

---

## [0.3.1] - 2026-04-17

### Added
- Added support for `marketplace@plugin:key` syntax in template list/use commands.

---

## [0.3.0] - 2026-04-17

### Added
- Introduced the `use` command, `template` group, `bench`, `version`, and auto-resolve functionality.

---

## [0.2.1] - 2026-04-17

### Fixed
- Fixed isolate bootstrap sources embedding via esbuild plugin.

---

## [0.2.0] - 2026-04-17

### Changed
- Bundled CLI with esbuild for a lean global install.

---

## [0.1.0] - 2026-04-17

### Added
- Introduced plugin ecosystem, rune isolation, and composition.

---

## [0.0.6] - 2026-04-17

### Changed
- Migrated to the `runes` naming convention.

---

## [0.0.5] - 2026-04-17

### Changed
- Reworked global options parsing.

---

## [0.0.4] - 2026-04-17

### Fixed
- Fixed proper version update logic.

---

## [0.0.3] - 2026-04-17

### Changed
- Removed legacy handling code.

---

## [0.0.0] - 2026-04-17

### Added
- Initial release.
