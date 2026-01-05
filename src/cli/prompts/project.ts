import prompts from 'prompts';
import chalk from 'chalk';
import type { CreateOptions, ProjectConfig, MonorepoContext } from '../../types/index.js';
import {
  validateProjectName,
  validatePackageName,
  validateDescription,
} from '../../validators/index.js';

export async function promptProjectConfig(
  projectName: string | undefined,
  options: CreateOptions,
  monorepoContext: MonorepoContext
): Promise<ProjectConfig> {
  const isNonInteractive = options.quiet || process.env.CI === 'true' || !process.stdin.isTTY;
  // If project name not provided, prompt for it
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      validate: (value: string) => {
        const validation = validateProjectName(value);
        if (!validation.success) {
          return validation.errors[0] || 'Invalid project name';
        }
        return true;
      },
    });
    projectName = response.projectName as string;
  }

  if (!projectName) {
    throw new Error('Project name is required');
  }

  // Package name
  const defaultPackageName = `@openmrs/esm-${projectName}`;
  const providedPackageName = options.packageName;
  let packageName = providedPackageName || defaultPackageName;

  // Validate package name
  const packageNameValidation = validatePackageName(packageName);
  if (!packageNameValidation.success) {
    // If provided name is invalid, use default
    if (providedPackageName) {
      console.warn(
        chalk.yellow(
          `⚠ Invalid package name "${providedPackageName}", using default: ${defaultPackageName}`
        )
      );
    }
    packageName = defaultPackageName;
  }

  // Description (always prompt in interactive mode, use default in non-interactive)
  let description: string;
  if (isNonInteractive) {
    description = `${projectName} frontend module for O3`;
  } else {
    const descriptionResponse = await prompts({
      type: 'text',
      name: 'description',
      message: 'Description:',
      initial: `${projectName} frontend module for O3`,
      validate: (value: string) => {
        const validation = validateDescription(value);
        if (!validation.success) {
          return validation.errors[0] || 'Invalid description';
        }
        return true;
      },
    });
    description = descriptionResponse.description as string;
  }

  // Validate description
  const descriptionValidation = validateDescription(description);
  if (!descriptionValidation.success) {
    throw new Error(`Invalid description: ${descriptionValidation.errors.join(', ')}`);
  }

  // Build tool (use --rspack flag or default to webpack)
  const buildTool = options.rspack ? 'rspack' : 'webpack';

  // Determine monorepo strategy
  let isMonorepo = false;
  let isNewMonorepo = false;

  if (options.standalone) {
    isMonorepo = false;
    isNewMonorepo = false;
  } else if (options.monorepo) {
    isMonorepo = true;
    isNewMonorepo = false;
  } else if (options.newMonorepo) {
    isMonorepo = true;
    isNewMonorepo = true;
  } else if (monorepoContext.isMonorepo) {
    const response = await prompts({
      type: 'confirm',
      name: 'useMonorepo',
      message: chalk.cyan('🔍 Detected existing monorepo. Create module in existing monorepo?'),
      initial: true,
    });
    isMonorepo = response.useMonorepo;
  } else {
    const response = await prompts({
      type: 'select',
      name: 'projectType',
      message: 'Project type:',
      choices: [
        { title: 'Standalone module', value: 'standalone' },
        { title: 'New monorepo with this module', value: 'new-monorepo' },
      ],
      initial: 0,
    });
    isNewMonorepo = response.projectType === 'new-monorepo';
    isMonorepo = isNewMonorepo;
  }

  // Package location (for monorepo)
  let packageLocation: string | undefined;
  if (isMonorepo) {
    const defaultLocation = `packages/apps/esm-${projectName}`;
    if (isNonInteractive) {
      packageLocation = defaultLocation;
    } else {
      const response = await prompts({
        type: 'text',
        name: 'packageLocation',
        message: 'Package location:',
        initial: defaultLocation,
      });
      packageLocation = (response.packageLocation as string) || undefined;
    }
  }

  // Git
  const git = options.git !== false;

  // CI
  const ci = options.ci !== false;

  return {
    projectName,
    packageName,
    description,
    buildTool,
    isMonorepo,
    isNewMonorepo,
    packageLocation,
    git,
    ci,
  };
}
