/**
 * release — Release snapshot
 *
 * Live view of the project's release state: current version, recent git
 * commits, recent changelog entries, and a quick reminder of the release
 * process.
 */
export async function generate(dir, args, utils) {
  const { md } = utils

  const version     = await utils.json.get('package.json', '$.version', 'unknown')
  const lockVersion = await utils.json.get('package-lock.json', '$.version', 'unknown')
  const name        = await utils.json.get('package.json', '$.name', '')

  const cliSrc = await utils.fs.read('src/cli.js', { throw: false }) ?? ''
  const cliVersionMatch = cliSrc.match(/\.version\(['"]([^'"]+)['"]/)
  const cliVersion = cliVersionMatch ? cliVersionMatch[1] : 'unknown'

  // Recent git commits (last 10)
  const gitLog = await utils.shell(
    'git log --oneline -10 --no-decorate',
    { throw: false, trim: true }
  )

  // Current branch + last tag
  const branch  = await utils.shell('git rev-parse --abbrev-ref HEAD', { throw: false, trim: true })
  const lastTag = await utils.shell('git describe --tags --abbrev=0', { throw: false, trim: true })

  // Unpushed commits count
  const unpushed = await utils.shell(
    'git rev-list --count @{u}..HEAD',
    { throw: false, trim: true }
  )

  // Recent CHANGELOG entries (first 3 version blocks)
  const changelog = await utils.fs.read('CHANGELOG.md', { throw: false }) ?? ''
  const recent = changelog
    .split(/(?=^## \[)/m)
    .filter(s => s.startsWith('## ['))
    .slice(0, 3)
    .map(s => s.trim())
    .join('\n\n')
    .trim()

  const sections = []

  sections.push(utils.section('version', {
    type: 'markdown',
    content: [
      md.table(
        ['Field', 'Value'],
        [
          ['Package',      md.code(name)],
          ['Version',      md.code(version)],
          ['Lock version', lockVersion === version ? `${md.code(lockVersion)} ✓` : `${md.code(lockVersion)} ⚠ out of sync`],
          ['CLI version',  cliVersion === version ? `${md.code(cliVersion)} ✓` : `${md.code(cliVersion)} ⚠ out of sync`],
          ['Branch',       md.code(branch || '—')],
          ['Last tag',     md.code(lastTag || '—')],
          ['Unpushed',     unpushed ? `${unpushed} commit(s)` : '0 (in sync)'],
        ]
      ),
    ].join('\n'),
  }, { title: 'Version & Status' }))

  if (gitLog) {
    sections.push(utils.section('commits', {
      type: 'markdown',
      content: md.codeBlock(gitLog, 'text'),
    }, { title: 'Recent Commits (last 10)' }))
  }

  sections.push(utils.section('changelog', {
    type: 'markdown',
    content: recent || '_No CHANGELOG.md found._',
  }, { title: 'Recent Changelog' }))

  sections.push(utils.section('process', {
    type: 'markdown',
    content: md.ol([
      `Bump version in ${md.code('package.json')} then run ${md.code('npm install')} to sync lockfile`,
      `Add ${md.code('## [x.y.z] - YYYY-MM-DD')} entry to ${md.code('CHANGELOG.md')}`,
      'Commit, tag, push — publish CI fires on the tag automatically',
    ]),
  }, { title: 'Release Process' }))

  return sections
}
