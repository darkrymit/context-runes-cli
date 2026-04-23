// Assembled inside the V8 isolate. Imports from pre-compiled isolate modules for
// md and tree; wires host-side Reference callbacks for fs, shell, and section.
// $__utils_* globals are injected by the host before this module is evaluated.

import * as md from 'crunes:md'
import * as tree from 'crunes:tree'

globalThis.utils = {
  fs: {
    read:   (p, o) => $__utils_fs_read.apply(undefined, [p, o ? JSON.stringify(o) : undefined], { result: { promise: true } }),
    exists: (p)    => $__utils_fs_exists.apply(undefined, [p], { result: { promise: true } }),
    glob:   (p, o) => $__utils_fs_glob.apply(undefined, [p, o ? JSON.stringify(o) : undefined], { result: { promise: true } }).then(JSON.parse),
  },
  shell: (cmd, o) => $__utils_shell.apply(undefined, [cmd, o ? JSON.stringify(o) : undefined], { result: { promise: true } })
    .then(r => { try { return JSON.parse(r) } catch { return r } }),
  section: (name, data, o) => JSON.parse(
    $__utils_section.applySync(undefined, [name, JSON.stringify(data), o ? JSON.stringify(o) : undefined])
  ),
  rune: (key, args) => $__utils_rune
    .apply(undefined, [key, args ? JSON.stringify(args) : undefined], { result: { promise: true } })
    .then(JSON.parse),
  json: {
    read:   (p, o) => $__utils_json_read.apply(undefined, [p, o ? JSON.stringify(o) : undefined], { result: { promise: true } }).then(JSON.parse),
    get:    (p, q, d) => $__utils_json_get.apply(undefined, [p, q, d !== undefined ? JSON.stringify(d) : undefined], { result: { promise: true } }).then(JSON.parse),
    getAll: (p, q, d) => $__utils_json_getAll.apply(undefined, [p, q, d !== undefined ? JSON.stringify(d) : undefined], { result: { promise: true } }).then(JSON.parse),
  },
  fetch: (url, opts) => $__utils_fetch
    .apply(undefined, [url, opts ? JSON.stringify(opts) : undefined], { result: { promise: true } })
    .then(raw => {
      const res = JSON.parse(raw)
      return {
        ok:         res.ok,
        status:     res.status,
        statusText: res.statusText,
        headers:    res.headers,
        text:       () => Promise.resolve(res._text),
        json:       () => Promise.resolve(JSON.parse(res._text)),
      }
    }),
  md,
  tree,
}
