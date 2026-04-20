# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
