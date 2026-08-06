import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

const testOutputDir = join(process.cwd(), 'test-package-json-output');

describe('package.json template integration', () => {
  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true });
    }
  });

  const moduleConfig: ModuleConfig = {
    type: 'page',
    routes: [
      {
        path: '/test',
        componentName: 'TestComponent',
      },
    ],
    extensions: [],
  };

  const options: CreateOptions = {
    dryRun: false,
  };

  const baseProjectConfig: ProjectConfig = {
    projectName: 'test-module',
    packageName: '@test/esm-test-module',
    description: 'A test module',
    buildTool: 'rspack',
    isMonorepo: false,
    isNewMonorepo: false,
    git: true,
    ci: true,
  };

  async function renderPackageJson(projectConfig: ProjectConfig) {
    await generateFiles(projectConfig, moduleConfig, options, testOutputDir);

    const outputPath = join(
      testOutputDir,
      projectConfig.packageLocation ?? projectConfig.projectName,
      'package.json'
    );
    return JSON.parse(readFileSync(outputPath, 'utf-8'));
  }

  it('stamps the generator marker with the CLI name and version', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.generator).toMatch(/^@openmrs\/create-o3-app@\d+\.\d+\.\d+$/);
  });

  it('generates installable rspack dependencies for standalone modules', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.devDependencies['@openmrs/esm-framework']).toBe('next');
    expect(packageJson.devDependencies['@openmrs/rspack-config']).toBe('next');
    expect(packageJson.devDependencies['@rspack/cli']).toBe('^1.7.10');
    expect(packageJson.devDependencies['@rspack/core']).toBe('^1.7.10');
    expect(Object.values(packageJson.devDependencies)).not.toContain('workspace:*');
  });

  it('does not emit unresolved workspace dependencies for new monorepos', async () => {
    const packageJson = await renderPackageJson({
      ...baseProjectConfig,
      isMonorepo: true,
      isNewMonorepo: true,
      packageLocation: 'packages/apps/esm-test-module',
    });

    expect(packageJson.devDependencies['@openmrs/esm-framework']).toBe('next');
    expect(packageJson.devDependencies['@openmrs/rspack-config']).toBe('next');
    expect(Object.values(packageJson.devDependencies)).not.toContain('workspace:*');
  });

  it('references the shared eslint config instead of individual plugins', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.devDependencies['@openmrs/eslint-config']).toBeDefined();
    expect(packageJson.devDependencies['eslint']).toBe('^9.39.0');
    // Provided by @openmrs/eslint-config, so generated apps must not declare them.
    expect(packageJson.devDependencies['@typescript-eslint/eslint-plugin']).toBeUndefined();
    expect(packageJson.devDependencies['@typescript-eslint/parser']).toBeUndefined();
    expect(packageJson.devDependencies['eslint-plugin-import']).toBeUndefined();
    expect(packageJson.devDependencies['eslint-plugin-jest-dom']).toBeUndefined();
    expect(packageJson.devDependencies['eslint-plugin-playwright']).toBeUndefined();
    expect(packageJson.devDependencies['eslint-plugin-react-hooks']).toBeUndefined();
    expect(packageJson.devDependencies['eslint-plugin-testing-library']).toBeUndefined();
  });

  it('generates a flat eslint config that composes the shared config', async () => {
    await generateFiles(baseProjectConfig, moduleConfig, options, testOutputDir);

    const projectDir = join(testOutputDir, baseProjectConfig.projectName);
    expect(existsSync(join(projectDir, 'eslint.config.mjs'))).toBe(true);
    expect(existsSync(join(projectDir, '.eslintrc'))).toBe(false);

    const eslintConfig = readFileSync(join(projectDir, 'eslint.config.mjs'), 'utf-8');
    expect(eslintConfig).toContain("from '@openmrs/eslint-config'");
    expect(eslintConfig).toContain("'react-hooks/exhaustive-deps': 'warn'");
  });

  it('generates a lint-safe empty config schema type', async () => {
    await generateFiles(baseProjectConfig, moduleConfig, options, testOutputDir);

    const configSchema = readFileSync(
      join(testOutputDir, baseProjectConfig.projectName, 'src', 'config-schema.ts'),
      'utf-8'
    );

    expect(configSchema).toContain('export type ConfigSchema = Record<string, never>;');
    expect(configSchema).not.toContain('export type ConfigSchema = {');
  });
});
