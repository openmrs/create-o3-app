import chalk from 'chalk';
import type { CreateOptions, ProjectConfig, ModuleConfig } from '../types/index.js';
import { detectMonorepo } from '../utils/monorepo.js';
import { promptProjectConfig } from '../cli/prompts/project.js';
import { promptModuleConfig } from '../cli/prompts/module.js';
import { generateStandaloneModule } from './standalone.js';
import { generateMonorepoModule } from './monorepo.js';
import { generateNewMonorepo } from './new-monorepo.js';
import { validateProjectConfig, validateModuleConfig } from '../validators/index.js';
import { logger } from '../utils/logger.js';
import { handleValidationError } from '../utils/error-handler.js';

export async function createProject(
  projectName: string | undefined,
  options: CreateOptions
): Promise<void> {
  // Detect monorepo context
  const monorepoContext = detectMonorepo(process.cwd());

  // Collect project configuration
  const projectConfig = await promptProjectConfig(projectName, options, monorepoContext);

  // Validate project configuration
  const projectValidation = validateProjectConfig(projectConfig);
  if (!projectValidation.success) {
    handleValidationError(
      'projectConfig',
      'Invalid project configuration',
      projectValidation.errors
    );
  }

  logger.debug('Project config validated', projectConfig);

  // Collect module configuration
  const moduleConfig = await promptModuleConfig(projectConfig, options);

  // Validate module configuration
  const moduleValidation = validateModuleConfig(moduleConfig);
  if (!moduleValidation.success) {
    handleValidationError('moduleConfig', 'Invalid module configuration', moduleValidation.errors);
  }

  logger.debug('Module config validated', moduleConfig);

  // Generate based on project type
  if (projectConfig.isNewMonorepo) {
    await generateNewMonorepo(projectConfig, moduleConfig, options);
  } else if (projectConfig.isMonorepo) {
    await generateMonorepoModule(projectConfig, moduleConfig, options);
  } else {
    await generateStandaloneModule(projectConfig, moduleConfig, options);
  }

  // O3 projects always use yarn (yarn 3+)
  const startCommand = 'yarn start';
  const installCommand = 'yarn install';

  // Show success message
  showSuccessMessage(projectConfig, moduleConfig, options, startCommand, installCommand);
}

/**
 * Display enhanced success message with context-aware documentation links
 */
function showSuccessMessage(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions,
  startCommand: string,
  installCommand: string
): void {
  const projectName = projectConfig.packageLocation || projectConfig.projectName;

  console.log(chalk.green(`\n✨ Successfully created ${projectConfig.projectName}!\n`));

  // Next steps
  console.log(chalk.yellow('📋 Next steps:'));
  if (projectConfig.isNewMonorepo) {
    console.log(chalk.gray(`   1. cd ${projectConfig.projectName}`));
    console.log(chalk.gray(`   2. cd ${projectConfig.packageLocation}`));
    console.log(chalk.gray(`   3. ${installCommand}`));
    console.log(chalk.gray(`   4. ${startCommand}`));
  } else {
    console.log(chalk.gray(`   1. cd ${projectName}`));
    console.log(chalk.gray(`   2. ${installCommand}`));
    console.log(chalk.gray(`   3. ${startCommand}`));
  }

  // Skip detailed messages in quiet mode
  if (options.quiet) {
    console.log(chalk.gray('\n   See README.md for more information\n'));
    return;
  }

  // Context-aware documentation links
  const hasRoutes = moduleConfig.routes && moduleConfig.routes.length > 0;
  const hasExtensions = moduleConfig.extensions && moduleConfig.extensions.length > 0;

  console.log(chalk.cyan('\n📚 Learn more about O3 development:'));
  console.log(chalk.gray('   • Getting Started: https://o3-docs.openmrs.org/docs/getting-started'));
  console.log(
    chalk.gray('   • Frontend Modules: https://o3-docs.openmrs.org/docs/frontend-modules/overview')
  );
  console.log(
    chalk.gray('   • Framework API: https://o3-docs.openmrs.org/docs/framework-concepts')
  );

  if (hasRoutes) {
    console.log(chalk.cyan('\n📄 Since you added routes, check out:'));
    console.log(
      chalk.gray('   • Routing Guide: https://o3-docs.openmrs.org/docs/frontend-modules/routing')
    );
  }

  if (hasExtensions) {
    console.log(chalk.cyan('\n🧩 Since you added extensions, check out:'));
    console.log(
      chalk.gray('   • Extension System: https://o3-docs.openmrs.org/docs/extension-system')
    );
  }

  console.log(chalk.cyan('\n🔧 Development resources:'));
  console.log(
    chalk.gray('   • Carbon for O3: https://o3-docs.openmrs.org/docs/carbon-and-styling')
  );
  console.log(
    chalk.gray('   • State Management: https://o3-docs.openmrs.org/docs/state-management')
  );
  console.log(chalk.gray('   • Testing Guide: https://o3-docs.openmrs.org/docs/testing'));

  console.log(chalk.cyan('\n💡 Pro tips:'));
  console.log(chalk.gray('   • Use `yarn run extract-translations` to update translation files'));
  console.log(chalk.gray('   • Run `yarn test` frequently during development'));
  console.log(
    chalk.gray('   • Check out real examples: https://github.com/openmrs/openmrs-esm-patient-chart')
  );

  console.log(chalk.gray('\n   Need help? Visit https://talk.openmrs.org/ or check the docs!'));
  console.log(chalk.green('\n   Happy building! 🚀\n'));
}
