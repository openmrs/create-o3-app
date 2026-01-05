import { mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../types/index.js';
import { generateFiles } from '../templates/engine.js';
import { initializeGit } from '../utils/git.js';
import { installDependencies } from '../utils/package-manager.js';
import { logger } from '../utils/logger.js';
import { handleFileSystemError } from '../utils/error-handler.js';

export async function generateStandaloneModule(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions
): Promise<void> {
  const outputDir = join(process.cwd(), projectConfig.projectName);
  const spinner = ora('[1/4] Generating standalone module...').start();

  try {
    // Create project directory
    if (!options.dryRun) {
      if (!existsSync(outputDir)) {
        try {
          mkdirSync(outputDir, { recursive: true });
          logger.debug('Created project directory', { outputDir });
        } catch {
          handleFileSystemError('Failed to create project directory', outputDir, 'mkdir', [
            'Check if you have write permissions in the current directory',
            'Verify the directory path is valid',
            'Ensure the directory does not already exist with conflicting files',
          ]);
        }
      } else {
        logger.warn('Project directory already exists', { outputDir });
      }
    } else {
      logger.info(`[DRY RUN] Would create directory: ${outputDir}`);
    }

    // Generate files from template
    spinner.text = '[2/4] Generating files from template...';
    const fileCount = await generateFiles(projectConfig, moduleConfig, options, process.cwd());
    spinner.text = `[2/4] Generated ${fileCount} files from template`;

    if (options.dryRun) {
      spinner.succeed(chalk.yellow('Dry run completed - no files were created'));
      return;
    }

    // Initialize git if requested (skip in dry run)
    if (projectConfig.git && !options.dryRun) {
      spinner.text = '[3/4] Initializing git repository...';
      await initializeGit(outputDir);
    } else if (projectConfig.git && options.dryRun) {
      logger.info('[DRY RUN] Would initialize git repository');
    }

    // Install dependencies (skip in dry run)
    if (!options.dryRun) {
      spinner.text = '[4/4] Installing dependencies...';
      await installDependencies(outputDir, options);
    } else {
      logger.info('[DRY RUN] Would install dependencies');
    }

    spinner.succeed(chalk.green('Standalone module generated successfully!'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate standalone module'));
    throw error;
  }
}
