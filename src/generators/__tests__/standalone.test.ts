import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue([]),
}));

vi.mock('../../templates/engine.js', () => ({
  generateFiles: vi.fn().mockResolvedValue(1),
}));

vi.mock('../../utils/git.js', () => ({
  initializeGit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../utils/package-manager.js', () => ({
  installDependencies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('ora', () => ({
  default: () => ({
    start: () => ({
      text: '',
      stop: vi.fn(),
      succeed: vi.fn(),
      fail: vi.fn(),
    }),
  }),
}));

import { generateStandaloneModule } from '../standalone.js';
import { generateFiles } from '../../templates/engine.js';
import { installDependencies } from '../../utils/package-manager.js';

describe('generateStandaloneModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes files into the package-name directory and installs there', async () => {
    const projectConfig = {
      projectName: 'billing',
      packageName: '@openmrs/esm-billing',
      description: 'billing frontend module for O3',
      buildTool: 'rspack',
      isMonorepo: false,
      isNewMonorepo: false,
      git: false,
    };
    const moduleConfig = {
      type: 'page',
      routes: [],
      extensions: [],
    };
    const options = {
      dryRun: false,
    };

    await generateStandaloneModule(projectConfig, moduleConfig, options);

    const expectedDirName = 'openmrs-esm-billing';
    const expectedOutputDir = join(process.cwd(), expectedDirName);

    expect(generateFiles).toHaveBeenCalledTimes(1);
    expect(generateFiles).toHaveBeenCalledWith(
      expect.objectContaining({ packageLocation: expectedDirName }),
      moduleConfig,
      options,
      process.cwd()
    );

    expect(installDependencies).toHaveBeenCalledWith(expectedOutputDir, options);
  });

  it('refuses to scaffold into a non-empty target directory', async () => {
    const { existsSync, readdirSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['package.json'] as never);

    const projectConfig = {
      projectName: 'billing',
      packageName: '@openmrs/esm-billing',
      description: 'billing frontend module for O3',
      buildTool: 'rspack',
      isMonorepo: false,
      isNewMonorepo: false,
      git: false,
    };

    await expect(
      generateStandaloneModule(projectConfig, { type: 'page', routes: [] }, { dryRun: false })
    ).rejects.toThrow(/already exists and is not empty/);

    expect(generateFiles).not.toHaveBeenCalled();
  });

  it('overwrites a non-empty target directory when --force is passed', async () => {
    const { existsSync, readdirSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue(['package.json'] as never);

    const projectConfig = {
      projectName: 'billing',
      packageName: '@openmrs/esm-billing',
      description: 'billing frontend module for O3',
      buildTool: 'rspack',
      isMonorepo: false,
      isNewMonorepo: false,
      git: false,
    };

    await expect(
      generateStandaloneModule(
        projectConfig,
        { type: 'page', routes: [] },
        { dryRun: false, force: true }
      )
    ).resolves.toBeUndefined();

    expect(generateFiles).toHaveBeenCalledTimes(1);
  });

  it('allows an existing but empty target directory', async () => {
    const { existsSync, readdirSync } = await import('fs');
    vi.mocked(existsSync).mockReturnValue(true);
    vi.mocked(readdirSync).mockReturnValue([] as never);

    const projectConfig = {
      projectName: 'billing',
      packageName: '@openmrs/esm-billing',
      description: 'billing frontend module for O3',
      buildTool: 'rspack',
      isMonorepo: false,
      isNewMonorepo: false,
      git: false,
    };

    await expect(
      generateStandaloneModule(projectConfig, { type: 'page', routes: [] }, { dryRun: false })
    ).resolves.toBeUndefined();

    expect(generateFiles).toHaveBeenCalledTimes(1);
  });
});
