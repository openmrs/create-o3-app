import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../types/index.js';
import { generateFiles } from '../templates/engine.js';
import { updateWorkspaceConfig } from '../utils/workspace.js';
import { logger } from '../utils/logger.js';

export async function generateMonorepoModule(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions
): Promise<void> {
  if (!projectConfig.packageLocation) {
    throw new Error('Package location is required for monorepo modules');
  }

  const outputDir = join(process.cwd(), projectConfig.packageLocation);
  const spinner = ora('[1/3] Generating monorepo module...').start();

  try {
    // Create module directory (skip in dry run)
    if (!options.dryRun) {
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
    } else {
      logger.info(`[DRY RUN] Would create directory: ${outputDir}`);
    }

    // Generate files from template
    spinner.text = '[2/3] Generating files from template...';
    const fileCount = await generateFiles(projectConfig, moduleConfig, options, process.cwd());
    spinner.text = `[2/3] Generated ${fileCount} files from template`;

    if (options.dryRun) {
      spinner.succeed(chalk.yellow('Dry run completed - no files were created'));
      logger.info('[DRY RUN] Would update workspace configuration');
      return;
    }

    // Update workspace configuration
    spinner.text = '[3/3] Updating workspace configuration...';
    await updateWorkspaceConfig(process.cwd(), projectConfig.packageLocation);

    spinner.succeed(chalk.green('Monorepo module generated successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate monorepo module'));
    throw error;
  }
}
