import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, writeFileSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

// Mock the template loader
vi.mock('../loader.js', () => ({
  getTemplateInfo: vi.fn(() => ({
    version: 'latest',
    path: join(process.cwd(), 'test-templates'),
  })),
}));

const testOutputDir = join(process.cwd(), 'test-output');
const testTemplatesDir = join(process.cwd(), 'test-templates');

describe('Template Engine', () => {
  beforeEach(() => {
    // Clean up any existing test directories
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true });
    }

    // Create test directories
    mkdirSync(testTemplatesDir, { recursive: true });
    mkdirSync(testOutputDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directories
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    if (existsSync(testTemplatesDir)) {
      rmSync(testTemplatesDir, { recursive: true });
    }
  });

  const mockProjectConfig: ProjectConfig = {
    projectName: 'test-module',
    packageName: '@test/esm-test-module',
    description: 'A test module',
    buildTool: 'webpack',
    isMonorepo: false,
    isNewMonorepo: false,
    packageLocation: undefined,
    git: true,
    ci: true,
  };

  const mockModuleConfig: ModuleConfig = {
    type: 'page',
    routes: [
      {
        path: '/test',
        componentName: 'TestComponent',
      },
    ],
    extensions: [],
  };

  const mockOptions: CreateOptions = {
    git: true,
    ci: true,
    dryRun: false,
    verbose: false,
    quiet: false,
  };

  describe('.hbs file processing', () => {
    it('should strip .hbs extension from output files', async () => {
      // Create a test template with .hbs extension
      const templateContent = `{
  "name": "{{module.routes.0.componentName}}",
  "test": true
}`;
      writeFileSync(join(testTemplatesDir, 'test-config.json.hbs'), templateContent);

      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      // Check that output file has .json extension (not .json.hbs)
      const outputPath = join(testOutputDir, 'test-module', 'test-config.json');
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.name).toBe('TestComponent');
      expect(parsed.test).toBe(true);
    });

    it('should process tsconfig.json.hbs template correctly', async () => {
      // Create a mock tsconfig.json.hbs template
      const templateContent = `{
  "compilerOptions": {
    "target": "es2015",
    "paths": {
{{#if pathAliases}}
{{#each pathAliases}}
      "@{{this}}/*": ["./src/{{this}}/*"]{{#unless @last}},{{/unless}}
{{/each}}
{{else}}
      "@hooks/*": ["./src/hooks/*"],
      "@resources/*": ["./src/resources/*"]
{{/if}}
    }
  }
}`;
      writeFileSync(join(testTemplatesDir, 'tsconfig.json.hbs'), templateContent);

      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      // Check that tsconfig.json is created (not tsconfig.json.hbs)
      const outputPath = join(testOutputDir, 'test-module', 'tsconfig.json');
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.compilerOptions.target).toBe('es2015');
      expect(parsed.compilerOptions.paths['@hooks/*']).toEqual(['./src/hooks/*']);
      expect(parsed.compilerOptions.paths['@resources/*']).toEqual(['./src/resources/*']);
    });

    it('should process regular files without .hbs extension normally', async () => {
      // Create a regular file without .hbs extension
      const templateContent = `# {{projectName}}

This is a test README for {{packageName}}.`;
      writeFileSync(join(testTemplatesDir, 'README.md'), templateContent);

      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      // Check that README.md is created with same name
      const outputPath = join(testOutputDir, 'test-module', 'README.md');
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      expect(content).toContain('# test-module');
      expect(content).toContain('@test/esm-test-module');
    });

    it('should handle multiple .hbs files in subdirectories', async () => {
      // Create nested directory structure with .hbs files
      mkdirSync(join(testTemplatesDir, 'src'), { recursive: true });
      mkdirSync(join(testTemplatesDir, 'config'), { recursive: true });

      writeFileSync(
        join(testTemplatesDir, 'package.json.hbs'),
        `{
  "name": "{{packageName}}",
  "version": "1.0.0"
}`
      );

      writeFileSync(
        join(testTemplatesDir, 'src', 'index.ts.hbs'),
        `export const moduleName = '{{projectName}}';`
      );

      writeFileSync(
        join(testTemplatesDir, 'config', 'webpack.config.js.hbs'),
        `module.exports = {
  name: '{{projectName}}'
};`
      );

      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      // Check all files are created with correct extensions
      expect(existsSync(join(testOutputDir, 'test-module', 'package.json'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'test-module', 'src', 'index.ts'))).toBe(true);
      expect(existsSync(join(testOutputDir, 'test-module', 'config', 'webpack.config.js'))).toBe(
        true
      );

      // Verify .hbs files are not created
      expect(existsSync(join(testOutputDir, 'test-module', 'package.json.hbs'))).toBe(false);
      expect(existsSync(join(testOutputDir, 'test-module', 'src', 'index.ts.hbs'))).toBe(false);
    });
  });

  describe('dry run mode', () => {
    it('should not create files in dry run mode', async () => {
      const templateContent = `{"test": "{{projectName}}"}`;
      writeFileSync(join(testTemplatesDir, 'test.json.hbs'), templateContent);

      const dryRunOptions = { ...mockOptions, dryRun: true };
      await generateFiles(mockProjectConfig, mockModuleConfig, dryRunOptions, testOutputDir);

      // No files should be created in dry run mode
      expect(existsSync(join(testOutputDir, 'test-module'))).toBe(false);
    });
  });

  describe('file count reporting', () => {
    it('should return correct file count', async () => {
      writeFileSync(join(testTemplatesDir, 'file1.txt.hbs'), 'content1');
      writeFileSync(join(testTemplatesDir, 'file2.json.hbs'), '{"test": true}');
      writeFileSync(join(testTemplatesDir, 'file3.md'), '# Regular file');

      const fileCount = await generateFiles(
        mockProjectConfig,
        mockModuleConfig,
        mockOptions,
        testOutputDir
      );

      expect(fileCount).toBe(4); // includes declarations.d.ts
    });
  });
});
