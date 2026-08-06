import { existsSync, readdirSync } from 'fs';
import { FileSystemError } from './errors.js';

/**
 * Refuse to scaffold into a directory that already has contents unless the
 * user passed --force. The generators previously warned and then overwrote
 * every file unconditionally. A missing or empty directory is fine.
 */
export function assertTargetDirWritable(dir: string, force: boolean | undefined): void {
  if (force || !existsSync(dir)) {
    return;
  }
  const entries = readdirSync(dir).filter((entry) => entry !== '.DS_Store');
  if (entries.length > 0) {
    throw new FileSystemError(
      `Target directory already exists and is not empty: ${dir}`,
      dir,
      'write',
      [
        'Choose a different project name',
        'Remove the existing directory first',
        'Pass --force to overwrite its files',
      ]
    );
  }
}
