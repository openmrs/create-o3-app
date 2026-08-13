import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue([]),
  writeFileSync: vi.fn(),
}));

vi.mock('../../templates/engine.js', () => ({
  generateFiles: vi.fn().mockResolvedValue(1),
}));

vi.mock('../../utils/git.js', () => ({
  initializeGit: vi.fn().mockResolvedValue(undefined),
  createInitialCommit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('ora', () => ({
  default: () => ({
    start: () => ({
      text: '',
      succeed: vi.fn(),
      fail: vi.fn(),
    }),
  }),
}));

import { writeFileSync } from 'fs';
import { generateNewMonorepo } from '../new-monorepo.js';
import { generateFiles } from '../../templates/engine.js';
import { createInitialCommit, initializeGit } from '../../utils/git.js';

describe('generateNewMonorepo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const projectConfig = {
    projectName: 'demo-mono',
    packageName: '@openmrs/esm-demo-mono',
    description: 'demo monorepo frontend module for O3',
    buildTool: 'rspack',
    isMonorepo: true,
    isNewMonorepo: true,
    packageLocation: 'packages/apps/esm-demo-mono',
    git: false,
  };

  const moduleConfig = {
    type: 'page',
    routes: [],
    extensions: [],
  };

  function getWrittenJson(pathSuffix: string) {
    const call = vi
      .mocked(writeFileSync)
      .mock.calls.find(([path]) => String(path).endsWith(pathSuffix));
    expect(call).toBeDefined();
    return JSON.parse(String(call?.[1]));
  }

  it('writes root scripts and turbo config for reusable OpenMRS CI workflows', async () => {
    await generateNewMonorepo(projectConfig, moduleConfig, { dryRun: false });

    const rootPackageJson = getWrittenJson('demo-mono/package.json');
    expect(rootPackageJson.scripts).toEqual({
      start: 'yarn workspace @openmrs/esm-demo-mono start',
      build: 'turbo run build --color',
      lint: 'turbo run lint --color',
      typescript: 'turbo run typescript --color',
      test: 'turbo run test --color',
      verify: 'turbo run lint typescript test --color',
    });
    expect(rootPackageJson.workspaces).toEqual(['packages/apps/esm-demo-mono']);
    expect(rootPackageJson.devDependencies.turbo).toBe('^2.5.2');
    expect(rootPackageJson.packageManager).toBe('yarn@4.10.3');

    const turboConfig = getWrittenJson('demo-mono/turbo.json');
    expect(turboConfig).toEqual({
      $schema: 'https://turbo.build/schema.json',
      tasks: {
        build: {
          dependsOn: ['^build'],
          outputs: ['dist/**'],
        },
        lint: {},
        typescript: {
          dependsOn: ['^typescript'],
        },
        test: {
          dependsOn: ['^test'],
        },
      },
    });
  });

  it('writes module files into the workspace package location', async () => {
    await generateNewMonorepo(projectConfig, moduleConfig, { dryRun: false });

    expect(generateFiles).toHaveBeenCalledWith(
      projectConfig,
      moduleConfig,
      { dryRun: false },
      join(process.cwd(), 'demo-mono')
    );
  });

  it('commits after generating files when git is enabled', async () => {
    const order: string[] = [];
    vi.mocked(generateFiles).mockImplementation(async () => {
      order.push('generate');
      return 1;
    });
    vi.mocked(initializeGit).mockImplementation(async () => void order.push('init'));
    vi.mocked(createInitialCommit).mockImplementation(async () => void order.push('commit'));

    await generateNewMonorepo({ ...projectConfig, git: true }, moduleConfig, { dryRun: false });

    expect(order).toEqual(['generate', 'init', 'commit']);
  });
});
