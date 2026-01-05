import chalk from 'chalk';
import ora from 'ora';
import { createProject } from '../../generators/index.js';
import type { CreateOptions } from '../../types/index.js';
import { validateProjectName, validateCreateOptions } from '../../validators/index.js';
import { handleError } from '../../utils/error-handler.js';
import { logger } from '../../utils/logger.js';
import { handleValidationError } from '../../utils/error-handler.js';

export async function createCommand(
  projectName: string | undefined,
  options: CreateOptions
): Promise<void> {
  try {
    // Validate create options first (before setting logger, as validation may fail)
    const optionsValidation = validateCreateOptions(options);
    if (!optionsValidation.success) {
      handleValidationError('options', 'Invalid options provided', optionsValidation.errors);
    }

    // Set logger level based on options (after validation passes)
    if (options.verbose) {
      logger.setLevel(3); // DEBUG
    } else if (options.quiet) {
      logger.setQuiet(true);
    }

    // Validate project name if provided
    if (projectName) {
      const nameValidation = validateProjectName(projectName);
      if (!nameValidation.success) {
        handleValidationError('projectName', 'Invalid project name', nameValidation.errors);
      }
    }

    logger.debug('Starting project creation', { projectName, options });

    // Show dry run banner
    if (options.dryRun) {
      console.log(chalk.yellow('🔍 Dry run mode - no files will be created\n'));
    }

    // Start creation process
    const spinner = ora('Creating project...').start();

    try {
      await createProject(projectName, options);
      spinner.succeed(chalk.green('Project created successfully!'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to create project'));
      throw error;
    }
  } catch (error) {
    handleError(error, options.verbose);
    process.exit(1);
  }
}
