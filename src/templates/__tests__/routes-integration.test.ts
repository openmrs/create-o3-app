import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

// Mock the template loader
vi.mock('../loader.js', () => ({
  getTemplateInfo: vi.fn(),
}));

const testOutputDir = join(process.cwd(), 'test-routes-output');

describe('routes.json Integration', () => {
  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
    mkdirSync(testOutputDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  const mockProjectConfig: ProjectConfig = {
    projectName: 'test-routes-module',
    packageName: '@test/esm-test-routes',
    description: 'A test for routes generation',
    buildTool: 'webpack',
    isMonorepo: false,
    isNewMonorepo: false,
    git: true,
    ci: true,
  };

  const mockOptions: CreateOptions = {
    git: true,
    ci: true,
    dryRun: false,
    verbose: false,
    quiet: false,
  };

  it('should generate valid routes.json with pages and extensions', async () => {
    const mockModuleConfig: ModuleConfig = {
      type: 'both',
      routes: [
        {
          path: '/test-routes',
          componentName: 'TestRoutesComponent',
        },
      ],
      extensions: [
        {
          name: 'test-extension',
          slot: 'test-slot',
          componentName: 'TestExtensionComponent',
          order: 5,
        },
      ],
      backendDependencies: ['fhir2', 'webservices.rest'],
    };

    const testTemplatePath = join(process.cwd(), 'test-routes-templates');
    mkdirSync(testTemplatePath, { recursive: true });
    mkdirSync(join(testTemplatePath, 'src'), { recursive: true });

    // Copy the real routes.json template
    const realTemplatePath = join(
      process.cwd(),
      'src',
      'templates',
      'template-files',
      'src',
      'routes.json'
    );
    const realTemplate = readFileSync(realTemplatePath, 'utf-8');
    writeFileSync(join(testTemplatePath, 'src', 'routes.json'), realTemplate);

    // Mock the template loader
    const { getTemplateInfo } = await import('../loader.js');
    vi.mocked(getTemplateInfo).mockResolvedValue({
      version: 'latest',
      path: testTemplatePath,
    });

    try {
      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      const outputPath = join(testOutputDir, 'test-routes-module', 'src', 'routes.json');
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Verify schema reference
      expect(parsed.$schema).toBe('https://json.openmrs.org/routes.schema.json');

      // Verify backendDependencies section
      expect(parsed.backendDependencies).toBeDefined();
      expect(parsed.backendDependencies.fhir2).toBe('^1.0.0');
      expect(parsed.backendDependencies['webservices.rest']).toBe('^1.0.0');

      // Verify pages section
      expect(parsed.pages).toBeDefined();
      expect(parsed.pages).toHaveLength(1);
      expect(parsed.pages[0].route).toBe('test-routes');
      expect(parsed.pages[0].component).toBe('root');

      // Verify extensions section
      expect(parsed.extensions).toBeDefined();
      expect(parsed.extensions).toHaveLength(1);
      expect(parsed.extensions[0].name).toBe('test-extension');
      expect(parsed.extensions[0].slot).toBe('test-slot');
      expect(parsed.extensions[0].component).toBe('test-extension-component');
      expect(parsed.extensions[0].order).toBe(5);
    } finally {
      if (existsSync(testTemplatePath)) {
        rmSync(testTemplatePath, { recursive: true });
      }
    }
  });

  it('should generate routes.json without backendDependencies when not specified', async () => {
    const mockModuleConfig: ModuleConfig = {
      type: 'page',
      routes: [
        {
          path: '/simple-test',
          componentName: 'SimpleTestComponent',
        },
      ],
      extensions: [],
    };

    const testTemplatePath = join(process.cwd(), 'test-simple-routes-templates');
    mkdirSync(testTemplatePath, { recursive: true });
    mkdirSync(join(testTemplatePath, 'src'), { recursive: true });

    // Copy the real routes.json template
    const realTemplatePath = join(
      process.cwd(),
      'src',
      'templates',
      'template-files',
      'src',
      'routes.json'
    );
    const realTemplate = readFileSync(realTemplatePath, 'utf-8');
    writeFileSync(join(testTemplatePath, 'src', 'routes.json'), realTemplate);

    // Mock the template loader
    const { getTemplateInfo } = await import('../loader.js');
    vi.mocked(getTemplateInfo).mockResolvedValue({
      version: 'latest',
      path: testTemplatePath,
    });

    try {
      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      const outputPath = join(testOutputDir, 'test-routes-module', 'src', 'routes.json');
      const content = readFileSync(outputPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Verify schema reference is always included
      expect(parsed.$schema).toBe('https://json.openmrs.org/routes.schema.json');

      // Verify no backendDependencies section when not specified
      expect(parsed.backendDependencies).toBeUndefined();

      // But pages should still be there
      expect(parsed.pages).toBeDefined();
      expect(parsed.pages).toHaveLength(1);
      expect(parsed.pages[0].route).toBe('simple-test');
    } finally {
      if (existsSync(testTemplatePath)) {
        rmSync(testTemplatePath, { recursive: true });
      }
    }
  });
});
