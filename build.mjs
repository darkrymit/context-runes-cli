import * as esbuild from 'esbuild'
import { chmodSync } from 'node:fs'

await esbuild.build({
  entryPoints: ['src/cli.js'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/cli.js',
  external: ['isolated-vm'],
  inject: ['./require-shim.js'],
})

// Make executable on Unix/macOS
try { chmodSync('dist/cli.js', 0o755) } catch {}
