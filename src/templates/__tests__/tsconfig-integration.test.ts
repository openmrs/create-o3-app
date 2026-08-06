import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, copyFileSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

// Mock the template loader
vi.mock('../loader.js', () => ({
  getTemplateInfo: vi.fn(),
}));

const testOutputDir = join(process.cwd(), 'test-tsconfig-output');

describe('tsconfig.json.hbs Integration', () => {
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
    projectName: 'test-tsconfig-module',
    packageName: '@test/esm-test-tsconfig',
    description: 'A test for tsconfig generation',
    buildTool: 'rspack',
    isMonorepo: false,
    isNewMonorepo: false,
    git: true,
    ci: true,
  };

  const mockModuleConfig: ModuleConfig = {
    type: 'page',
    routes: [
      {
        path: '/test-tsconfig',
        componentName: 'TestTsconfigComponent',
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

  it('should generate valid tsconfig.json from real template', async () => {
    // Use the real template by copying it to a test location
    const realTemplatePath = join(
      process.cwd(),
      'src',
      'templates',
      'template-files',
      'tsconfig.json.hbs'
    );
    const testTemplatePath = join(process.cwd(), 'test-tsconfig-templates');

    mkdirSync(testTemplatePath, { recursive: true });
    copyFileSync(realTemplatePath, join(testTemplatePath, 'tsconfig.json.hbs'));

    // Mock the template loader
    const { getTemplateInfo } = await import('../loader.js');
    vi.mocked(getTemplateInfo).mockResolvedValue({
      version: 'latest',
      path: testTemplatePath,
    });

    try {
      await generateFiles(mockProjectConfig, mockModuleConfig, mockOptions, testOutputDir);

      const outputPath = join(testOutputDir, 'test-tsconfig-module', 'tsconfig.json');
      expect(existsSync(outputPath)).toBe(true);

      const content = readFileSync(outputPath, 'utf-8');

      // Verify it's valid JSON
      const parsed = JSON.parse(content);

      // Verify essential TypeScript config properties
      expect(parsed.compilerOptions).toBeDefined();
      expect(parsed.compilerOptions.target).toBe('es2015');
      expect(parsed.compilerOptions.module).toBe('esnext');
      expect(parsed.compilerOptions.jsx).toBe('react-jsx');
      expect(parsed.compilerOptions.moduleResolution).toBe('bundler');
      expect(parsed.compilerOptions.esModuleInterop).toBe(true);
      expect(parsed.compilerOptions.skipLibCheck).toBe(true);
      expect(parsed.compilerOptions.resolveJsonModule).toBe(true);
      expect(parsed.compilerOptions.noEmit).toBe(true);
      expect(parsed.compilerOptions.baseUrl).toBe('.');

      // Paths follow the ecosystem convention (patient-chart): __mocks__ and
      // tools only. Source aliases like @hooks were removed because the build
      // config does not resolve them; the generated README documents how to
      // set them up across all three configs.
      expect(parsed.compilerOptions.paths).toEqual({
        __mocks__: ['./__mocks__'],
        tools: ['./tools'],
      });

      // Verify lib array
      expect(parsed.compilerOptions.lib).toContain('dom');
      expect(parsed.compilerOptions.lib).toContain('es2015');
      expect(parsed.compilerOptions.lib).toContain('es2020');

      // Verify include; the old root-level `types` key was inert (tsc only
      // reads types inside compilerOptions) and is gone
      expect(parsed.include).toEqual(['src/**/*', 'tools/setup-tests.ts', 'vitest.config.ts']);
      expect(parsed.types).toBeUndefined();
    } finally {
      // Clean up test templates
      if (existsSync(testTemplatePath)) {
        rmSync(testTemplatePath, { recursive: true });
      }
    }
  });

});
