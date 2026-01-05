import { execa } from 'execa';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { logger } from './logger.js';

/**
 * Detect which package manager to use
 */
export function detectPackageManager(cwd: string): 'npm' | 'yarn' | 'pnpm' {
  // Check for lock files
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (existsSync(join(cwd, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(join(cwd, 'package-lock.json'))) {
    return 'npm';
  }

  // For new O3 projects, default to yarn (as specified in template)
  // Check if this looks like a new O3 project by looking for packageManager field
  try {
    const packageJsonPath = join(cwd, 'package.json');
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.packageManager?.startsWith('yarn')) {
        return 'yarn';
      }
    }
  } catch {
    // Ignore errors reading package.json
  }

  // Default to npm for non-O3 projects
  return 'npm';
}

/**
 * Install dependencies
 */
export async function installDependencies(
  projectPath: string,
  _options: { quiet?: boolean }
): Promise<void> {
  // O3 projects use yarn by default (specified in template package.json)
  // But still check for existing lock files in case adding to existing project
  const pm = detectPackageManager(projectPath);

  try {
    logger.info(`Installing dependencies with ${pm}...`);

    // Use execa for safer command execution
    if (pm === 'yarn') {
      await execa('yarn', ['install'], { cwd: projectPath });
    } else if (pm === 'pnpm') {
      await execa('pnpm', ['install'], { cwd: projectPath });
    } else {
      await execa('npm', ['install'], { cwd: projectPath });
    }

    logger.success(`Dependencies installed with ${pm}`);
  } catch (error) {
    logger.warn(`Failed to install dependencies with ${pm}`);
    logger.info('You can install dependencies manually later.');
    logger.debug('Package manager error', error);
    // Don't throw - dependency installation is optional
  }
}
