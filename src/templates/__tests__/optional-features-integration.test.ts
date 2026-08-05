import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync, cpSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

// Mock the template loader
vi.mock('../loader.js', () => ({
  getTemplateInfo: vi.fn(),
}));

const testOutputDir = join(process.cwd(), 'test-optional-features-output');
const testTemplatesDir = join(process.cwd(), 'test-optional-features-templates');
const realTemplatesDir = join(process.cwd(), 'src', 'templates', 'template-files');

describe('Optional features integration', () => {
  beforeEach(async () => {
    for (const dir of [testOutputDir, testTemplatesDir]) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true });
      }
    }
    mkdirSync(testOutputDir, { recursive: true });
    mkdirSync(testTemplatesDir, { recursive: true });

    // Copy the real opt-in templates
    cpSync(join(realTemplatesDir, 'turbo.json'), join(testTemplatesDir, 'turbo.json'));
    cpSync(join(realTemplatesDir, 'CONTRIBUTING.md'), join(testTemplatesDir, 'CONTRIBUTING.md'));
    mkdirSync(join(testTemplatesDir, '.github'), { recursive: true });
    cpSync(
      join(realTemplatesDir, '.github', 'dependabot.yml'),
      join(testTemplatesDir, '.github', 'dependabot.yml')
    );

    const { getTemplateInfo } = await import('../loader.js');
    vi.mocked(getTemplateInfo).mockResolvedValue({
      version: 'latest',
      path: testTemplatesDir,
    });
  });

  afterEach(() => {
    for (const dir of [testOutputDir, testTemplatesDir]) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true });
      }
    }
  });

  const mockProjectConfig: ProjectConfig = {
    projectName: 'test-optional-module',
    packageName: '@test/esm-test-optional',
    description: 'A test for optional features',
    buildTool: 'rspack',
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

  const baseModuleConfig: ModuleConfig = {
    type: 'page',
    routes: [{ path: '/test', componentName: 'TestComponent' }],
  };

  const outputRoot = join(testOutputDir, 'test-optional-module');

  it('excludes all opt-in files when their flags are disabled', async () => {
    await generateFiles(
      mockProjectConfig,
      { ...baseModuleConfig, turbo: false, dependabot: false, contributing: false },
      mockOptions,
      testOutputDir
    );

    expect(existsSync(join(outputRoot, 'turbo.json'))).toBe(false);
    expect(existsSync(join(outputRoot, '.github', 'dependabot.yml'))).toBe(false);
    expect(existsSync(join(outputRoot, 'CONTRIBUTING.md'))).toBe(false);
  });

  it('excludes all opt-in files when their flags are undefined', async () => {
    await generateFiles(mockProjectConfig, baseModuleConfig, mockOptions, testOutputDir);

    expect(existsSync(join(outputRoot, 'turbo.json'))).toBe(false);
    expect(existsSync(join(outputRoot, '.github', 'dependabot.yml'))).toBe(false);
    expect(existsSync(join(outputRoot, 'CONTRIBUTING.md'))).toBe(false);
  });

  it('generates turbo.json when the turbo flag is enabled', async () => {
    await generateFiles(
      mockProjectConfig,
      { ...baseModuleConfig, turbo: true },
      mockOptions,
      testOutputDir
    );

    const outputPath = join(outputRoot, 'turbo.json');
    expect(existsSync(outputPath)).toBe(true);

    const parsed = JSON.parse(readFileSync(outputPath, 'utf-8'));
    expect(parsed.pipeline.build).toBeDefined();
  });

  it('generates .github/dependabot.yml when the dependabot flag is enabled', async () => {
    await generateFiles(
      mockProjectConfig,
      { ...baseModuleConfig, dependabot: true },
      mockOptions,
      testOutputDir
    );

    const outputPath = join(outputRoot, '.github', 'dependabot.yml');
    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');
    expect(content).toContain('version: 2');
    expect(content).toContain("package-ecosystem: 'npm'");
  });

  it('generates CONTRIBUTING.md when the contributing flag is enabled', async () => {
    await generateFiles(
      mockProjectConfig,
      { ...baseModuleConfig, contributing: true },
      mockOptions,
      testOutputDir
    );

    const outputPath = join(outputRoot, 'CONTRIBUTING.md');
    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');
    expect(content).toContain('# Contributing to @test/esm-test-optional');
  });

  it('reflects per-route offline values in routes.json', async () => {
    // Copy the real routes.json template
    mkdirSync(join(testTemplatesDir, 'src'), { recursive: true });
    cpSync(
      join(realTemplatesDir, 'src', 'routes.json'),
      join(testTemplatesDir, 'src', 'routes.json')
    );

    const moduleConfig: ModuleConfig = {
      type: 'both',
      offline: true,
      routes: [{ path: '/test', componentName: 'TestComponent', online: true, offline: true }],
      extensions: [
        {
          name: 'test-extension',
          slot: 'test-slot',
          componentName: 'TestExtensionComponent',
          online: true,
          offline: true,
        },
      ],
    };

    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    const parsed = JSON.parse(readFileSync(join(outputRoot, 'src', 'routes.json'), 'utf-8'));
    expect(parsed.pages[0].offline).toBe(true);
    expect(parsed.extensions[0].offline).toBe(true);
  });

  it('omits the offline key from routes.json when offline support is declined', async () => {
    mkdirSync(join(testTemplatesDir, 'src'), { recursive: true });
    cpSync(
      join(realTemplatesDir, 'src', 'routes.json'),
      join(testTemplatesDir, 'src', 'routes.json')
    );

    const moduleConfig: ModuleConfig = {
      type: 'page',
      offline: false,
      routes: [{ path: '/test', componentName: 'TestComponent', online: true, offline: false }],
    };

    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    const parsed = JSON.parse(readFileSync(join(outputRoot, 'src', 'routes.json'), 'utf-8'));
    expect(parsed.pages[0].offline).toBeUndefined();
    expect(parsed.pages[0].online).toBe(true);
  });

  it('does not exclude files that merely mention flag names in their content', async () => {
    // A file that merely mentions the flag names in its content must not be excluded
    writeFileSync(join(testTemplatesDir, 'notes.md'), 'turbo dependabot contributing');

    await generateFiles(
      mockProjectConfig,
      { ...baseModuleConfig, turbo: false, dependabot: false, contributing: false },
      mockOptions,
      testOutputDir
    );

    expect(existsSync(join(outputRoot, 'notes.md'))).toBe(true);
  });
});
