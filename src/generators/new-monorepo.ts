import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../types/index.js';
import { generateFiles } from '../templates/engine.js';
import { assertTargetDirWritable } from '../utils/target-dir.js';
import { createInitialCommit, initializeGit } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import { handleFileSystemError } from '../utils/error-handler.js';

export async function generateNewMonorepo(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions
): Promise<void> {
  const rootDir = join(process.cwd(), projectConfig.projectName);
  const packageLocation =
    projectConfig.packageLocation || `packages/apps/esm-${projectConfig.projectName}`;
  const spinner = ora('[1/3] Generating new monorepo...').start();

  try {
    if (!options.dryRun) {
      // Refuse before writing anything. Guarding only the package directory
      // left an unrelated non-empty root being given a manifest, a README, a
      // .gitignore, and a package directory.
      assertTargetDirWritable(rootDir, options.force);
      if (!existsSync(rootDir)) {
        try {
          mkdirSync(rootDir, { recursive: true });
        } catch {
          handleFileSystemError('Failed to create monorepo root directory', rootDir, 'mkdir', [
            'Check if you have write permissions in the current directory',
            'Verify the directory path is valid',
            'Ensure the directory does not already exist with conflicting files',
          ]);
        }
      }

      const rootPackageJsonPath = join(rootDir, 'package.json');
      if (!existsSync(rootPackageJsonPath)) {
        const rootPackageJson = {
          name: projectConfig.projectName,
          private: true,
          workspaces: [packageLocation],
          packageManager: 'yarn@4.10.3',
        };
        writeFileSync(
          rootPackageJsonPath,
          JSON.stringify(rootPackageJson, null, 2) + '\n',
          'utf-8'
        );
      }

      // The root owns the package manager and Yarn configuration, so a child
      // install cannot disagree with a root install about the linker or the
      // Yarn version
      const rootYarnrcPath = join(rootDir, '.yarnrc.yml');
      if (!existsSync(rootYarnrcPath)) {
        writeFileSync(rootYarnrcPath, 'nodeLinker: node-modules\n', 'utf-8');
      }

      const rootReadmePath = join(rootDir, 'README.md');
      if (!existsSync(rootReadmePath)) {
        const readme = `# ${projectConfig.projectName}\n\nMonorepo created with create-o3-app.\n`;
        writeFileSync(rootReadmePath, readme, 'utf-8');
      }

      const rootGitignorePath = join(rootDir, '.gitignore');
      if (!existsSync(rootGitignorePath)) {
        const gitignore = `node_modules\n.DS_Store\ndist\ncoverage\n`;
        writeFileSync(rootGitignorePath, gitignore, 'utf-8');
      }
    } else {
      logger.info(`[DRY RUN] Would create directory: ${rootDir}`);
      logger.info(`[DRY RUN] Would create root package.json with workspace: ${packageLocation}`);
      logger.info('[DRY RUN] Would create root README.md and .gitignore');
    }

    spinner.text = '[2/3] Generating module from template...';
    const fileCount = await generateFiles(projectConfig, moduleConfig, options, rootDir);
    spinner.text = `[2/3] Generated ${fileCount} files from template`;

    if (options.dryRun) {
      spinner.succeed(chalk.yellow('Dry run completed - no files were created'));
      return;
    }

    // Initialize git at the monorepo root, like standalone projects do
    if (projectConfig.git) {
      spinner.text = '[3/3] Initializing git repository...';
      await initializeGit(rootDir);
      await createInitialCommit(rootDir);
    }

    spinner.succeed(chalk.green('New monorepo generated successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate new monorepo'));
    throw error;
  }
}
