import * as md from './md.js';
import * as treeUtils from './tree.js';

function section(name, data, { title, attrs } = {}) {
  return { name, title, attrs: attrs ?? {}, data };
}

export function createUtils() {
  return {
    md,
    tree: treeUtils,
    section,
  };
}
