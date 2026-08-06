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
      .mockResolvedValueOnce({ offline: false });

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

  it('drops the partial entry when a collection prompt is cancelled', async () => {
    const mockedPrompts = vi.mocked(prompts);
    mockedPrompts
      .mockResolvedValueOnce({ moduleType: 'page' })
      .mockResolvedValueOnce({ create: true })
      // Cancelling the modal name prompt resolves with no answer
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ dependencies: '' })
      .mockResolvedValueOnce({ offline: false });

    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.stubEnv('CI', 'false');

    try {
      const config = await promptModuleConfig(projectConfig, {});

      // No entry with undefined fields is pushed
      expect(config.modals).toEqual([]);
    } finally {
      Reflect.deleteProperty(process.stdin, 'isTTY');
      vi.unstubAllEnvs();
    }
  });

  it('drops an unmatched feature flag reference when the user declines to keep it', async () => {
    const mockedPrompts = vi.mocked(prompts);
    mockedPrompts
      .mockResolvedValueOnce({ moduleType: 'both' })
      .mockResolvedValueOnce({ name: 'gated-ext' })
      .mockResolvedValueOnce({ name: 'some-slot' })
      .mockResolvedValueOnce({ name: 'GatedExt' })
      .mockResolvedValueOnce({ name: 'orphan-flag' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      // The flag is not defined locally, so the CLI asks whether it is a
      // deliberate reference to another module's flag; declining drops it
      .mockResolvedValueOnce({ keep: false })
      .mockResolvedValueOnce({ dependencies: '' })
      .mockResolvedValueOnce({ offline: false });

    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.stubEnv('CI', 'false');

    try {
      const config = await promptModuleConfig(projectConfig, {});
      expect(config.extensions?.[0].featureFlag).toBeUndefined();
    } finally {
      Reflect.deleteProperty(process.stdin, 'isTTY');
      vi.unstubAllEnvs();
    }
  });

  it('keeps an unmatched feature flag reference when confirmed as external', async () => {
    const mockedPrompts = vi.mocked(prompts);
    mockedPrompts
      .mockResolvedValueOnce({ moduleType: 'both' })
      .mockResolvedValueOnce({ name: 'gated-ext' })
      .mockResolvedValueOnce({ name: 'some-slot' })
      .mockResolvedValueOnce({ name: 'GatedExt' })
      .mockResolvedValueOnce({ name: 'external-flag' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ keep: true })
      .mockResolvedValueOnce({ dependencies: '' })
      .mockResolvedValueOnce({ offline: false });

    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.stubEnv('CI', 'false');

    try {
      const config = await promptModuleConfig(projectConfig, {});
      expect(config.extensions?.[0].featureFlag).toBe('external-flag');
    } finally {
      Reflect.deleteProperty(process.stdin, 'isTTY');
      vi.unstubAllEnvs();
    }
  });

  it('rejects component names whose generated files would collide', async () => {
    const mockedPrompts = vi.mocked(prompts);
    mockedPrompts
      .mockResolvedValueOnce({ moduleType: 'page' })
      .mockResolvedValueOnce({ create: true })
      .mockResolvedValueOnce({ name: 'delete-thing-modal' })
      .mockResolvedValueOnce({ name: 'DeleteThingModal' })
      .mockResolvedValueOnce({ addMore: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ create: false })
      .mockResolvedValueOnce({ dependencies: '' })
      .mockResolvedValueOnce({ offline: false });

    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
    vi.stubEnv('CI', 'false');

    try {
      await promptModuleConfig(projectConfig, {});

      // Grab the validate callback the modal component-name prompt received
      const componentQuestion = mockedPrompts.mock.calls
        .map(([question]) => question)
        .find(
          (question) =>
            !Array.isArray(question) && question.message === 'Component name:'
        ) as { validate: (value: string) => true | string };

      // A repeat of the collected modal component
      expect(componentQuestion.validate('DeleteThingModal')).toMatch(
        /is configured more than once/
      );
      // A collision with the default route component (TestModule -> test-module.scss)
      expect(componentQuestion.validate('TestModuleModal')).toMatch(
        /Page component "TestModule".*src\/test-module\.scss/
      );
      // A fresh name passes
      expect(componentQuestion.validate('ConfirmThingModal')).toBe(true);
    } finally {
      Reflect.deleteProperty(process.stdin, 'isTTY');
      vi.unstubAllEnvs();
    }
  });
});
