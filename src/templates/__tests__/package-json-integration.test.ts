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

  it('generates installable rspack dependencies for standalone modules', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.devDependencies['@openmrs/esm-framework']).toBe('next');
    expect(packageJson.devDependencies['@openmrs/rspack-config']).toBe('next');
    expect(packageJson.devDependencies['@rspack/cli']).toBe('^1.7.10');
    expect(packageJson.devDependencies['@rspack/core']).toBe('^1.7.10');
    expect(Object.values(packageJson.devDependencies)).not.toContain('workspace:*');
  });

  it('declares the Carbon singleton packages in peerDependencies', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.peerDependencies['@carbon/react']).toBe('1.x');
    expect(packageJson.peerDependencies['@carbon/icons-react']).toBe('11.x');
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

  it('includes the eslint plugins referenced by the generated eslint config', async () => {
    const packageJson = await renderPackageJson(baseProjectConfig);

    expect(packageJson.devDependencies['@typescript-eslint/eslint-plugin']).toBeDefined();
    expect(packageJson.devDependencies['@typescript-eslint/parser']).toBeDefined();
    expect(packageJson.devDependencies['eslint-plugin-import']).toBeDefined();
    expect(packageJson.devDependencies['eslint-plugin-jest-dom']).toBeDefined();
    expect(packageJson.devDependencies['eslint-plugin-playwright']).toBeDefined();
    expect(packageJson.devDependencies['eslint-plugin-react-hooks']).toBeDefined();
    expect(packageJson.devDependencies['eslint-plugin-testing-library']).toBeDefined();
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
