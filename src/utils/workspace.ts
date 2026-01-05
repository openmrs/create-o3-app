import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

function updatePnpmWorkspace(pnpmWorkspacePath: string, packageLocation: string): void {
  const normalizedLocation = packageLocation.replace(/\/$/, '');
  let content = '';
  if (existsSync(pnpmWorkspacePath)) {
    content = readFileSync(pnpmWorkspacePath, 'utf-8');
  }

  const lines = content.split(/\r?\n/);
  const packagesIndex = lines.findIndex((line) => line.trim() === 'packages:');

  if (packagesIndex === -1) {
    lines.push('packages:', `  - "${normalizedLocation}"`);
  } else {
    let endIndex = packagesIndex + 1;
    const existing: string[] = [];
    while (endIndex < lines.length) {
      const line = lines[endIndex];
      if (line.trim() === '') {
        endIndex++;
        continue;
      }
      if (!line.trim().startsWith('-')) {
        break;
      }
      const match = line.match(/-\s*["']?(.+?)["']?\s*$/);
      if (match) {
        existing.push(match[1]);
      }
      endIndex++;
    }
    if (!existing.includes(normalizedLocation)) {
      lines.splice(endIndex, 0, `  - "${normalizedLocation}"`);
    }
  }

  writeFileSync(pnpmWorkspacePath, lines.join('\n'), 'utf-8');
}

/**
 * Update workspace configuration to include new package
 */
export async function updateWorkspaceConfig(
  monorepoRoot: string,
  packageLocation: string
): Promise<void> {
  const pnpmWorkspacePath = join(monorepoRoot, 'pnpm-workspace.yaml');
  if (existsSync(pnpmWorkspacePath)) {
    try {
      updatePnpmWorkspace(pnpmWorkspacePath, packageLocation);
      console.log(chalk.green(`✓ Added ${packageLocation.replace(/\/$/, '')} to pnpm workspace`));
      return;
    } catch (error) {
      console.warn(
        chalk.yellow('⚠ Failed to update pnpm workspace configuration:'),
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  const packageJsonPath = join(monorepoRoot, 'package.json');

  if (!existsSync(packageJsonPath)) {
    console.warn(chalk.yellow('⚠ No package.json found at monorepo root'));
    return;
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Update workspaces array
    if (packageJson.workspaces) {
      const workspaces = Array.isArray(packageJson.workspaces)
        ? packageJson.workspaces
        : packageJson.workspaces.packages || [];

      // Check if package location already in workspaces
      const normalizedLocation = packageLocation.replace(/\/$/, '');
      if (!workspaces.includes(normalizedLocation)) {
        workspaces.push(normalizedLocation);

        if (Array.isArray(packageJson.workspaces)) {
          packageJson.workspaces = workspaces;
        } else {
          packageJson.workspaces.packages = workspaces;
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
        console.log(chalk.green(`✓ Added ${normalizedLocation} to workspaces`));
      }
    }
  } catch (error) {
    console.warn(
      chalk.yellow('⚠ Failed to update workspace configuration:'),
      error instanceof Error ? error.message : String(error)
    );
  }
}
