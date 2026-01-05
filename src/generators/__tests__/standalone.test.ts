import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  mkdirSync: vi.fn(),
}));

vi.mock('../templates/engine.js', () => ({
  generateFiles: vi.fn().mockResolvedValue(1),
}));

vi.mock('../utils/git.js', () => ({
  initializeGit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../utils/package-manager.js', () => ({
  installDependencies: vi.fn().mockResolvedValue(undefined),
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

import { generateStandaloneModule } from '../standalone.js';
import { generateFiles } from '../../templates/engine.js';
import { installDependencies } from '../../utils/package-manager.js';

describe('generateStandaloneModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.skip('writes files into the package-name directory and installs there', async () => {
    const projectConfig = {
      projectName: 'billing',
      packageName: '@openmrs/esm-billing',
      description: 'billing frontend module for O3',
      buildTool: 'webpack',
      isMonorepo: false,
      isNewMonorepo: false,
      git: false,
      ci: false,
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
});
