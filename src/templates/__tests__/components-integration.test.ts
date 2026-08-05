import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, cpSync } from 'fs';
import { join } from 'path';
import { generateFiles } from '../engine.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';

// Mock the template loader
vi.mock('../loader.js', () => ({
  getTemplateInfo: vi.fn(),
}));

const testOutputDir = join(process.cwd(), 'test-components-output');
const testTemplatesDir = join(process.cwd(), 'test-components-templates');
const realTemplatesDir = join(process.cwd(), 'src', 'templates', 'template-files');

describe('Modal and workspace component generation', () => {
  beforeEach(async () => {
    for (const dir of [testOutputDir, testTemplatesDir]) {
      if (existsSync(dir)) {
        rmSync(dir, { recursive: true });
      }
    }
    mkdirSync(join(testTemplatesDir, 'src'), { recursive: true });

    // Copy the real component templates and index.ts
    for (const file of [
      'modal.component.tsx',
      'modal.scss',
      'workspace.component.tsx',
      'workspace.scss',
      'index.ts',
    ]) {
      cpSync(join(realTemplatesDir, 'src', file), join(testTemplatesDir, 'src', file));
    }

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
    projectName: 'test-components-module',
    packageName: '@test/esm-test-components',
    description: 'A test for modal and workspace generation',
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

  const moduleConfig: ModuleConfig = {
    type: 'both',
    routes: [{ path: '/test', componentName: 'TestComponent' }],
    extensions: [
      { name: 'test-extension', slot: 'test-slot', componentName: 'TestExtension' },
    ],
    modals: [{ name: 'delete-thing-modal', componentName: 'DeleteThingModal' }],
    workspaces: [
      {
        name: 'thing-form-workspace',
        title: 'Thing form',
        componentName: 'ThingFormWorkspace',
        type: 'form',
      },
    ],
  };

  const outputSrc = join(testOutputDir, 'test-components-module', 'src');

  it('generates a component and stylesheet per modal', async () => {
    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    const componentPath = join(outputSrc, 'delete-thing-modal.component.tsx');
    expect(existsSync(componentPath)).toBe(true);
    expect(existsSync(join(outputSrc, 'delete-thing-modal.scss'))).toBe(true);

    const content = readFileSync(componentPath, 'utf-8');
    expect(content).toContain('const DeleteThingModal');
    expect(content).toContain('closeModal');
    expect(content).toContain("import styles from './delete-thing-modal.scss'");
  });

  it('generates a component and stylesheet per workspace', async () => {
    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    const componentPath = join(outputSrc, 'thing-form-workspace.component.tsx');
    expect(existsSync(componentPath)).toBe(true);
    expect(existsSync(join(outputSrc, 'thing-form-workspace.scss'))).toBe(true);

    const content = readFileSync(componentPath, 'utf-8');
    expect(content).toContain('const ThingFormWorkspace');
    expect(content).toContain('DefaultWorkspaceProps');
    expect(content).toContain('closeWorkspace');
  });

  it('exports every component from index.ts via getAsyncLifecycle', async () => {
    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    const content = readFileSync(join(outputSrc, 'index.ts'), 'utf-8');

    expect(content).toContain(
      "export const testExtension = getAsyncLifecycle(\n  () => import('./test-extension.component'),"
    );
    expect(content).toContain(
      "export const deleteThingModal = getAsyncLifecycle(\n  () => import('./delete-thing-modal.component'),"
    );
    expect(content).toContain(
      "export const thingFormWorkspace = getAsyncLifecycle(\n  () => import('./thing-form-workspace.component'),"
    );
    // getSyncLifecycle takes a component, not an import thunk; it must not be used here
    expect(content).not.toContain('getSyncLifecycle');
  });

  it('does not emit the raw modal or workspace templates', async () => {
    await generateFiles(mockProjectConfig, moduleConfig, mockOptions, testOutputDir);

    expect(existsSync(join(outputSrc, 'modal.component.tsx'))).toBe(false);
    expect(existsSync(join(outputSrc, 'workspace.component.tsx'))).toBe(false);
    expect(existsSync(join(outputSrc, 'modal.scss'))).toBe(false);
    expect(existsSync(join(outputSrc, 'workspace.scss'))).toBe(false);
  });

  it('generates nothing extra when no modals or workspaces are configured', async () => {
    await generateFiles(
      mockProjectConfig,
      { type: 'page', routes: [{ path: '/test', componentName: 'TestComponent' }] },
      mockOptions,
      testOutputDir
    );

    expect(existsSync(join(outputSrc, 'delete-thing-modal.component.tsx'))).toBe(false);
    expect(existsSync(join(outputSrc, 'thing-form-workspace.component.tsx'))).toBe(false);
    expect(existsSync(join(outputSrc, 'modal.component.tsx'))).toBe(false);
    expect(existsSync(join(outputSrc, 'workspace.component.tsx'))).toBe(false);
  });
});
