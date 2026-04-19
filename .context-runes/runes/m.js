export function generate(dir, args, utils) {
  // args: string[] passed from $m(arg1, arg2)
  const root = utils.tree.node('m', 'Root description', [
    utils.tree.node('child', 'Child description'),
  ]);
  return utils.section('example-tree', { type: 'tree', root });
}
