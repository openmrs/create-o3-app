import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { MonorepoContext } from '../types/index.js';

export function detectMonorepo(cwd: string): MonorepoContext {
  const packageJsonPath = join(cwd, 'package.json');
  const pnpmWorkspacePath = join(cwd, 'pnpm-workspace.yaml');
  const yarnWorkspacePath = join(cwd, '.yarnrc.yml');

  // Check for pnpm workspace
  if (existsSync(pnpmWorkspacePath)) {
    return {
      isMonorepo: true,
      type: 'pnpm',
      rootPath: cwd,
    };
  }

  // Read package.json if present
  let packageJson: { workspaces?: unknown; packageManager?: string } | undefined;
  if (existsSync(packageJsonPath)) {
    try {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch {
      // Ignore parse errors
    }
  }

  // Check for yarn workspace (yarn config or packageManager field)
  const isYarn =
    existsSync(yarnWorkspacePath) || (packageJson?.packageManager?.startsWith('yarn@') ?? false);
  if (isYarn && packageJson?.workspaces) {
    return {
      isMonorepo: true,
      type: 'yarn',
      rootPath: cwd,
      workspacePattern: Array.isArray(packageJson.workspaces)
        ? packageJson.workspaces[0]
        : (packageJson.workspaces as { packages?: string[] }).packages?.[0],
    };
  }

  // Check for npm workspace (package.json with workspaces field)
  if (packageJson?.workspaces) {
    return {
      isMonorepo: true,
      type: 'npm',
      rootPath: cwd,
    };
  }

  return {
    isMonorepo: false,
  };
}
