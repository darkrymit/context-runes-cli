export async function use(dir, args, utils) {
  const sections = [];

  if (args.length === 0) {
    const readmeContent = await utils.fs.read('src/README.md', { throw: false }) || '_No top-level README found._';
    sections.push(utils.section.create('src-readme', { type: 'markdown', content: readmeContent }));
    
    const tree = await utils.fs.glob('src/**/*', { throw: false });
    if (tree) {
      sections.push(utils.section.create('src-files', { type: 'markdown', content: utils.md.codeBlock(tree.join('\n'), 'text') }));
    }
    return sections;
  }

  for (const arg of args) {
    const subPath = arg.replace(/\./g, '/');
    const fullPath = `src/${subPath}`;
    
    // 1. Read README
    const readme = await utils.fs.read(`${fullPath}/README.md`, { throw: false });
    if (readme) {
      sections.push(utils.section.create(`${arg}-readme`, { type: 'markdown', content: readme }));
    } else {
      sections.push(utils.section.create(`${arg}-readme`, { type: 'markdown', content: `_No README found for ${arg}._` }));
    }

    // 2. Generate file tree
    const files = await utils.fs.glob(`${fullPath}/**/*`, { throw: false });
    if (files && files.length > 0) {
      sections.push(utils.section.create(`${arg}-files`, { type: 'markdown', content: utils.md.codeBlock(files.join('\n'), 'text') }));
    } else {
      sections.push(utils.section.create(`${arg}-files`, { type: 'markdown', content: `_Module not found or empty: ${arg}_` }));
    }
  }

  return sections;
}
