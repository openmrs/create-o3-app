import chalk from 'chalk';
import { logger } from './logger.js';
import {
  CLIError,
  ValidationError,
  TemplateError,
  FileSystemError,
  GitError,
  NetworkError,
  PackageManagerError,
  isCLIError,
  createErrorMessage,
} from './errors.js';

/**
 * Handle and display errors gracefully
 */
export function handleError(error: unknown, verbose = false): void {
  const message = createErrorMessage(error);

  // Log error based on type
  if (isCLIError(error)) {
    logger.error(message);

    // Add context based on error type
    if (error instanceof ValidationError && error.field) {
      logger.info(`Field: ${error.field}`);
    }

    if (error instanceof TemplateError && error.templatePath) {
      logger.info(`Template path: ${error.templatePath}`);
    }

    if (error instanceof FileSystemError) {
      if (error.path) {
        logger.info(`Path: ${error.path}`);
      }
      if (error.operation) {
        logger.info(`Operation: ${error.operation}`);
      }
    }

    if (error instanceof GitError && error.command) {
      logger.info(`Git command: ${error.command}`);
    }

    if (error instanceof NetworkError && error.url) {
      logger.info(`URL: ${error.url}`);
    }

    if (error instanceof PackageManagerError) {
      if (error.packageManager) {
        logger.info(`Package manager: ${error.packageManager}`);
      }
      if (error.command) {
        logger.info(`Command: ${error.command}`);
      }
    }

    // Make suggestions prominent
    if (error.suggestions && error.suggestions.length > 0) {
      console.error(chalk.yellow('\n💡 Suggestions:'));
      error.suggestions.forEach((suggestion, index) => {
        console.error(chalk.gray(`   ${index + 1}. ${suggestion}`));
      });
    }
  } else {
    logger.error(message);
  }

  // Show stack trace in verbose mode
  if (verbose && error instanceof Error && error.stack) {
    console.error(chalk.gray('\nStack trace:'));
    console.error(chalk.gray(error.stack));
  }

  // Show helpful links
  console.error(chalk.gray('\nFor help, visit: https://github.com/openmrs/create-o3-app/issues'));
}

/**
 * Wrap async function with error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  verbose = false
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, verbose);
      process.exit(1);
    }
  };
}

/**
 * Create error with suggestions
 */
export function createErrorWithSuggestions(
  message: string,
  suggestions: string[],
  code?: string
): CLIError {
  return new CLIError(message, code, suggestions);
}

/**
 * Handle validation errors
 */
export function handleValidationError(
  field: string,
  message: string,
  suggestions?: string[]
): never {
  throw new ValidationError(message, field, suggestions);
}

/**
 * Handle template errors
 */
export function handleTemplateError(
  message: string,
  templatePath?: string,
  suggestions?: string[]
): never {
  throw new TemplateError(message, templatePath, suggestions);
}

/**
 * Handle file system errors
 */
export function handleFileSystemError(
  message: string,
  path?: string,
  operation?: string,
  suggestions?: string[]
): never {
  throw new FileSystemError(message, path, operation, suggestions);
}

/**
 * Handle git errors
 */
export function handleGitError(message: string, command?: string, suggestions?: string[]): never {
  throw new GitError(message, command, suggestions);
}

/**
 * Handle network errors
 */
export function handleNetworkError(message: string, url?: string, suggestions?: string[]): never {
  throw new NetworkError(message, url, suggestions);
}

/**
 * Handle package manager errors
 */
export function handlePackageManagerError(
  message: string,
  packageManager?: string,
  command?: string,
  suggestions?: string[]
): never {
  throw new PackageManagerError(message, packageManager, command, suggestions);
}
