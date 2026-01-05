/**
 * Base error class for CLI errors
 */
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly suggestions?: string[]
  ) {
    super(message);
    this.name = 'CLIError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error
 */
export class ValidationError extends CLIError {
  constructor(
    message: string,
    public readonly field?: string,
    suggestions?: string[]
  ) {
    super(message, 'VALIDATION_ERROR', suggestions);
    this.name = 'ValidationError';
  }
}

/**
 * Template error
 */
export class TemplateError extends CLIError {
  constructor(
    message: string,
    public readonly templatePath?: string,
    suggestions?: string[]
  ) {
    super(message, 'TEMPLATE_ERROR', suggestions);
    this.name = 'TemplateError';
  }
}

/**
 * File system error
 */
export class FileSystemError extends CLIError {
  constructor(
    message: string,
    public readonly path?: string,
    public readonly operation?: string,
    suggestions?: string[]
  ) {
    super(message, 'FILE_SYSTEM_ERROR', suggestions);
    this.name = 'FileSystemError';
  }
}

/**
 * Git error
 */
export class GitError extends CLIError {
  constructor(
    message: string,
    public readonly command?: string,
    suggestions?: string[]
  ) {
    super(message, 'GIT_ERROR', suggestions);
    this.name = 'GitError';
  }
}

/**
 * Network error
 */
export class NetworkError extends CLIError {
  constructor(
    message: string,
    public readonly url?: string,
    suggestions?: string[]
  ) {
    super(message, 'NETWORK_ERROR', suggestions);
    this.name = 'NetworkError';
  }
}

/**
 * Package manager error
 */
export class PackageManagerError extends CLIError {
  constructor(
    message: string,
    public readonly packageManager?: string,
    public readonly command?: string,
    suggestions?: string[]
  ) {
    super(message, 'PACKAGE_MANAGER_ERROR', suggestions);
    this.name = 'PackageManagerError';
  }
}

/**
 * Format error message with suggestions
 */
export function formatError(error: Error | CLIError): string {
  let message = error.message;

  if (error instanceof CLIError && error.suggestions && error.suggestions.length > 0) {
    message += '\n\nSuggestions:';
    error.suggestions.forEach((suggestion, index) => {
      message += `\n  ${index + 1}. ${suggestion}`;
    });
  }

  return message;
}

/**
 * Check if error is a known CLI error
 */
export function isCLIError(error: unknown): error is CLIError {
  return error instanceof CLIError;
}

/**
 * Create user-friendly error message
 */
export function createErrorMessage(error: unknown): string {
  if (error instanceof CLIError) {
    return formatError(error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
