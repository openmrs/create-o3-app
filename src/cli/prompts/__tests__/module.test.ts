import { describe, it, expect, vi } from 'vitest';
import prompts from 'prompts';
import { promptModuleConfig } from '../module.js';
import type { ProjectConfig, CreateOptions } from '../../../types/index.js';

vi.mock('prompts', () => ({
  default: vi.fn(),
}));

const projectConfig: ProjectConfig = {
  projectName: 'test-module',
  packageName: '@test/esm-test-module',
  description: 'A test module',
  buildTool: 'rspack',
  isMonorepo: false,
  isNewMonorepo: false,
  git: true,
  ci: true,
};

describe('promptModuleConfig (non-interactive)', () => {
  it('applies the offline default to the generated default route', async () => {
    const options: CreateOptions = { quiet: true };

    const config = await promptModuleConfig(projectConfig, options);

    expect(config.offline).toBe(false);
    expect(config.routes).toHaveLength(1);
    expect(config.routes?.[0].online).toBe(true);
    expect(config.routes?.[0].offline).toBe(false);
  });

  it('applies the offline default to routes provided via flags', async () => {
    const options: CreateOptions = {
      quiet: true,
      route: '/custom-route',
      routeComponent: 'CustomComponent',
    };

    const config = await promptModuleConfig(projectConfig, options);

    expect(config.routes).toHaveLength(1);
    expect(config.routes?.[0].path).toBe('/custom-route');
    expect(config.routes?.[0].offline).toBe(false);
  });

  it('uses the documented defaults for optional features', async () => {
    const options: CreateOptions = { quiet: true };

    const config = await promptModuleConfig(projectConfig, options);

    expect(config.coverageThresholds).toBe(true);
    expect(config.pathAliases).toBeUndefined();
  });

  it('leaves modals, workspaces, and feature flags undefined', async () => {
    const options: CreateOptions = { quiet: true };

    const config = await promptModuleConfig(projectConfig, options);

    expect(config.modals).toBeUndefined();
    expect(config.workspaces).toBeUndefined();
    expect(config.featureFlags).toBeUndefined();
  });
});

describe('promptModuleConfig (interactive standalone)', () => {
  it('collects modals, workspaces, and feature flags when no non-interactive flags are set', async () => {
    const mockedPrompts = vi.mocked(prompts);
    mockedPrompts
      .mockResolvedValueOnce({ moduleType: 'page' })
      .mockResolvedValueOnce({ create: true })
      .mockResolvedValueOnce({ name: 'delete-thing-modal' })
      .mockResolvedValueOnce({ name: 'DeleteThingModal' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ create: true })
      .mockResolvedValueOnce({ name: 'thing-form-workspace' })
      .mockResolvedValueOnce({ title: 'Thing form' })
      .mockResolvedValueOnce({ name: 'ThingFormWorkspace' })
      .mockResolvedValueOnce({ type: ' patient-search-workspace ' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ create: true })
      .mockResolvedValueOnce({ name: 'experimental-thing' })
      .mockResolvedValueOnce({ label: 'Experimental thing' })
      .mockResolvedValueOnce({ description: 'Enables the experimental thing.' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ dependencies: '' })
      .mockResolvedValueOnce({ offline: false })
      .mockResolvedValueOnce({ pathAliases: false })
      .mockResolvedValueOnce({ coverage: true });

    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.stubEnv('CI', 'false');

    try {
      const config = await promptModuleConfig(projectConfig, {});

      expect(config.modals).toEqual([
        { name: 'delete-thing-modal', componentName: 'DeleteThingModal' },
      ]);
      expect(config.workspaces).toEqual([
        {
          name: 'thing-form-workspace',
          title: 'Thing form',
          componentName: 'ThingFormWorkspace',
          type: 'patient-search-workspace',
        },
      ]);
      expect(mockedPrompts).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'text',
          name: 'type',
          message: 'Workspace type:',
          initial: 'form',
        })
      );
      expect(config.featureFlags).toEqual([
        {
          name: 'experimental-thing',
          label: 'Experimental thing',
          description: 'Enables the experimental thing.',
        },
      ]);
    } finally {
      Reflect.deleteProperty(process.stdin, 'isTTY');
      vi.unstubAllEnvs();
    }
  });
});
