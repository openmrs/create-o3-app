import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { isScalar, isSeq, parseDocument } from 'yaml';

/**
 * Add a package location to pnpm-workspace.yaml. The file is parsed and
 * serialized as YAML rather than edited line by line: a valid inline
 * declaration like `packages: ["packages/*"]` is not a `packages:` line, so
 * appending to it produced a second `packages` key and a file that no longer
 * parses (YAML map keys must be unique). parseDocument preserves the user's
 * comments and formatting.
 */
function updatePnpmWorkspace(pnpmWorkspacePath: string, packageLocation: string): void {
  const normalizedLocation = packageLocation.replace(/\/$/, '');
  const content = existsSync(pnpmWorkspacePath) ? readFileSync(pnpmWorkspacePath, 'utf-8') : '';
  const doc = parseDocument(content);

  if (doc.errors.length > 0) {
    // Never rewrite a file we could not read: that would compound the problem
    throw new Error(`${pnpmWorkspacePath} is not valid YAML: ${doc.errors[0].message}`);
  }

  const packages = doc.get('packages');

  if (!isSeq(packages)) {
    if (packages !== undefined && packages !== null) {
      throw new Error(`${pnpmWorkspacePath} has a "packages" key that is not a list`);
    }
    doc.set('packages', doc.createNode([normalizedLocation]));
  } else {
    const existing = packages.items.map((item) =>
      isScalar(item) ? String(item.value) : undefined
    );
    if (existing.includes(normalizedLocation)) {
      return;
    }
    packages.add(doc.createNode(normalizedLocation));
  }

  writeFileSync(pnpmWorkspacePath, doc.toString(), 'utf-8');
}

/**
 * Returns an error message if the directory does not declare a workspace the
 * generated package could join. `--monorepo` used to report success against an
 * ordinary project: the package was generated, no root configuration changed,
 * and nothing included it in a workspace.
 */
export function monorepoRootError(monorepoRoot: string): string | null {
  if (existsSync(join(monorepoRoot, 'pnpm-workspace.yaml'))) {
    return null;
  }
  const packageJsonPath = join(monorepoRoot, 'package.json');
  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (packageJson.workspaces) {
        return null;
      }
    } catch {
      return `Could not read ${packageJsonPath}`;
    }
  }
  return `No workspace declaration found in ${monorepoRoot}. A monorepo root needs a "workspaces" field in package.json or a pnpm-workspace.yaml file.`;
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
