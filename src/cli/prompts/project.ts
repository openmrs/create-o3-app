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
  // Consider non-interactive if quiet, CI, no TTY, or project type flags are provided
  const isNonInteractive =
    options.quiet ||
    process.env.CI === 'true' ||
    !process.stdin.isTTY ||
    options.standalone ||
    options.monorepo ||
    options.newMonorepo;
  // If project name not provided, prompt for it
  if (!projectName) {
    const response = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name (e.g., "patient-chart" → @openmrs/esm-patient-chart):',
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

  // Normalize project name by removing common OpenMRS prefixes
  const normalizeProjectName = (name: string): string => {
    return name
      .replace(/^openmrs-esm-/, '') // Remove "openmrs-esm-" prefix
      .replace(/^esm-/, '')         // Remove "esm-" prefix
      .replace(/^openmrs-/, '');    // Remove "openmrs-" prefix
  };

  // Normalize the project name to avoid redundant prefixes
  const originalProjectName = projectName;
  projectName = normalizeProjectName(projectName);
  
  if (originalProjectName !== projectName) {
    console.log(chalk.cyan(`💡 Normalized project name from "${originalProjectName}" to "${projectName}"`));
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

  // Description (use default - description prompt is optional)
  // We skip the description prompt to avoid hanging in terminals where prompts aren't visible
  const description = `${projectName} frontend module for O3`;

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
    // Default to standalone when no flags provided (better UX, avoids hanging prompts)
    console.log(chalk.cyan('ℹ️  No project type specified. Defaulting to standalone module.'));
    console.log(chalk.gray('   Use --standalone, --monorepo, or --new-monorepo to be explicit.\n'));
    isMonorepo = false;
    isNewMonorepo = false;
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
