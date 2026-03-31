import { handler as queryHandler } from './query.js';

export async function handler({ key, args = [], nonInteractive = false, projectRoot = process.cwd() }) {
  return queryHandler({ key, args, format: 'md', nonInteractive, projectRoot });
}
