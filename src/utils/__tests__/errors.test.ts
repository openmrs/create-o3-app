import { describe, it, expect } from 'vitest';
import {
  CLIError,
  ValidationError,
  TemplateError,
  FileSystemError,
  GitError,
  NetworkError,
  PackageManagerError,
  isCLIError,
  formatError,
  createErrorMessage,
} from '../errors.js';

describe('Error Classes', () => {
  describe('CLIError', () => {
    it('should create error with message', () => {
      const error = new CLIError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.code).toBeUndefined();
      expect(error.suggestions).toBeUndefined();
    });

    it('should create error with code and suggestions', () => {
      const error = new CLIError('Test error', 'TEST_CODE', ['Suggestion 1', 'Suggestion 2']);
      expect(error.code).toBe('TEST_CODE');
      expect(error.suggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid value', 'fieldName');
      expect(error.field).toBe('fieldName');
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('TemplateError', () => {
    it('should create template error with path', () => {
      const error = new TemplateError('Template not found', '/path/to/template');
      expect(error.templatePath).toBe('/path/to/template');
      expect(error.code).toBe('TEMPLATE_ERROR');
    });
  });

  describe('FileSystemError', () => {
    it('should create file system error with path and operation', () => {
      const error = new FileSystemError('File not found', '/path/to/file', 'read');
      expect(error.path).toBe('/path/to/file');
      expect(error.operation).toBe('read');
      expect(error.code).toBe('FILE_SYSTEM_ERROR');
    });
  });

  describe('GitError', () => {
    it('should create git error with command', () => {
      const error = new GitError('Git command failed', 'git clone');
      expect(error.command).toBe('git clone');
      expect(error.code).toBe('GIT_ERROR');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with URL', () => {
      const error = new NetworkError('Network request failed', 'https://example.com');
      expect(error.url).toBe('https://example.com');
      expect(error.code).toBe('NETWORK_ERROR');
    });
  });

  describe('PackageManagerError', () => {
    it('should create package manager error with PM and command', () => {
      const error = new PackageManagerError('Install failed', 'npm', 'npm install');
      expect(error.packageManager).toBe('npm');
      expect(error.command).toBe('npm install');
      expect(error.code).toBe('PACKAGE_MANAGER_ERROR');
    });
  });

  describe('isCLIError', () => {
    it('should identify CLI errors', () => {
      const error = new CLIError('Test');
      expect(isCLIError(error)).toBe(true);
    });

    it('should reject non-CLI errors', () => {
      const error = new Error('Test');
      expect(isCLIError(error)).toBe(false);
    });
  });

  describe('formatError', () => {
    it('should format error with suggestions', () => {
      const error = new CLIError('Test error', undefined, ['Suggestion 1', 'Suggestion 2']);
      const formatted = formatError(error);
      expect(formatted).toContain('Test error');
      expect(formatted).toContain('Suggestion 1');
      expect(formatted).toContain('Suggestion 2');
    });

    it('should format error without suggestions', () => {
      const error = new CLIError('Test error');
      const formatted = formatError(error);
      expect(formatted).toBe('Test error');
    });
  });

  describe('createErrorMessage', () => {
    it('should create message from CLIError', () => {
      const error = new CLIError('Test error', undefined, ['Suggestion']);
      const message = createErrorMessage(error);
      expect(message).toContain('Test error');
    });

    it('should create message from Error', () => {
      const error = new Error('Test error');
      const message = createErrorMessage(error);
      expect(message).toBe('Test error');
    });

    it('should create message from string', () => {
      const message = createErrorMessage('Test error');
      expect(message).toBe('Test error');
    });
  });
});
