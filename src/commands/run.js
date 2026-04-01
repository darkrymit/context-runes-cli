import { handler as queryHandler } from './query.js';

export async function handler({ key, args = [], yes = false, projectRoot = process.cwd() }) {
  return queryHandler({ key, args, format: 'md', yes, projectRoot });
}
