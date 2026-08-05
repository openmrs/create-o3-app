import { describe, it, expect } from 'vitest';
import { promptModuleConfig } from '../module.js';
import type { ProjectConfig, CreateOptions } from '../../../types/index.js';

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
    expect(config.accessibility).toBe(true);
    expect(config.dependabot).toBe(true);
    expect(config.contributing).toBe(true);
    expect(config.turbo).toBe(false);
  });
});
