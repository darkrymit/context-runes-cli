# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.4.3] - 2026-04-21

### Fixed
- Fixed `fs.glob` permission enforcement. Glob patterns are now canonicalized (ensuring a `./` prefix for relative paths) before being checked against the permission list, resolving a regression where `fs.glob` calls were incorrectly denied when using the normalized syntax.

---

## [1.4.2] - 2026-04-20

### Added
- Added automatic path normalization for filesystem permissions (`fs.read`, `fs.exists`, `fs.glob`). Permission declarations can now use either bare paths (e.g., `package.json`) or prefixed paths (e.g., `./package.json`); both are automatically mapped to the internal canonical form.

---

## [1.4.1] - 2026-04-20

### Fixed
- Extracted CLI program factory to `src/program.js` to enable isolated testing of command definitions and completion logic.
- Fixed shell completion handlers to correctly receive the program instance, resolving failures in `bash`, `zsh`, `fish`, and `powershell` tab-completion.
- Formatted completion choices to ensure consistent behavior across different shells.

---

## [1.4.0] - 2026-04-20

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

## [1.3.12] - 2026-04-20

### Added
- Added `AGENTS.md` and symlinks (`GEMINI.md`, `CLAUDE.md`) to guide AI coding assistants on project architecture and release workflows.
- Improved the `release` context rune to dynamically monitor version synchronization across `package.json`, `package-lock.json`, and `src/cli.js`.

### Fixed
- Fixed CI workflow to correctly use `npm test` (Vitest) instead of Node's built-in test runner.
- Replaced the `prepare` lifecycle hook with `prepack` in `package.json` to avoid redundant builds during `npm install`.
- Synchronized internal CLI version with `package.json`.

---

## [1.3.11] - 2026-04-20

### Changed
- Optimized test suite to focus on API contracts: removed redundant prose assertions that duplicated snapshot coverage, merged overlapping `PermissionError` tests, and dropped trivial factory-function tests with no branching logic.

---

## [1.3.10] - 2026-04-19

### Changed
- Internal version bump for npm sync.

---

## [1.3.9] - 2026-04-17

### Fixed
- Fixed `isolated-vm` segmentation faults on macOS + Node 20+ by dynamically injecting `--no-node-snapshot`.

---

## [1.3.8] - 2026-04-17

### Added
- Added granular trace logging inside `isolated-vm` lifecycle to pinpoint macOS segfaults.

---

## [1.3.7] - 2026-04-17

### Added
- Hardened error catching and added `--verbose` trace logs around execution to debug silent crashes.

---

## [1.3.6] - 2026-04-17

### Added
- Added `--verbose` global flag to print full stack traces on rune failures.

---

## [1.3.5] - 2026-04-17

### Changed
- Version bump to synchronize npm release.

---

## [1.3.4] - 2026-04-17

### Fixed
- Updated documentation to accurately reflect the latest CLI argument syntax, key parsing, and global flags.

---

## [1.3.3] - 2026-04-17

### Fixed
- Fixed a bug causing `crunes create` to output a non-standard config shape.
- Fixed an `isolated-vm` relative module resolution issue that led to crashes in nested imports.

---

## [1.3.2] - 2026-04-17

### Changed
- Wrapped markdown sections in ` ```md ``` ` fenced blocks.

---

## [1.3.1] - 2026-04-17

### Added
- Added support for `marketplace@plugin:key` syntax in template list/use commands.

---

## [1.3.0] - 2026-04-17

### Added
- Introduced the `use` command, `template` group, `bench`, `version`, and auto-resolve functionality.

---

## [1.2.1] - 2026-04-17

### Fixed
- Fixed isolate bootstrap sources embedding via esbuild plugin.

---

## [1.2.0] - 2026-04-17

### Changed
- Bundled CLI with esbuild for a lean global install.

---

## [1.1.0] - 2026-04-17

### Added
- Introduced plugin ecosystem, rune isolation, and composition.

---

## [1.0.6] - 2026-04-17

### Changed
- Migrated to the `runes` naming convention.

---

## [1.0.5] - 2026-04-17

### Changed
- Reworked global options parsing.

---

## [1.0.4] - 2026-04-17

### Fixed
- Fixed proper version update logic.

---

## [1.0.3] - 2026-04-17

### Changed
- Removed legacy handling code.

---

## [1.0.0] - 2026-04-17

### Added
- Initial release.
