import prompts from 'prompts';
import chalk from 'chalk';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';
import {
  validateComponentName,
  validateExtensionName,
  validateSlotName,
  validateBackendDependency,
} from '../../validators/index.js';

export async function promptModuleConfig(
  projectConfig: ProjectConfig,
  options: CreateOptions
): Promise<ModuleConfig> {
  // Check if we're in non-interactive mode (CI, no TTY, flags provided, or defaulted to standalone)
  const componentName = options.routeComponent;
  // If project was defaulted to standalone (no flags provided), treat as non-interactive
  const wasDefaultedToStandalone =
    !options.standalone && !options.monorepo && !options.newMonorepo && !projectConfig.isMonorepo;
  const isNonInteractive =
    options.quiet ||
    process.env.CI === 'true' ||
    !process.stdin.isTTY ||
    options.standalone ||
    options.monorepo ||
    options.newMonorepo ||
    wasDefaultedToStandalone ||
    (options.route && componentName);

  // Determine module type from options
  // If route/component provided, assume 'page'
  // If extension-related flags provided, assume 'extension'
  // Otherwise prompt (unless non-interactive)
  let moduleType: 'page' | 'extension' | 'both' | 'modal' = 'page';

  if (options.route || componentName) {
    // User provided route/component, assume page
    moduleType = 'page';
  } else {
    // Default to page type when no flags provided (better UX, avoids hanging prompts)
    moduleType = 'page';
  }

  const config: ModuleConfig = {
    type: moduleType,
  };

  // Routes (if page or both)
  if (config.type === 'page' || config.type === 'both') {
    config.routes = [];

    // If route and component provided via flags, use them
    const componentName = options.routeComponent;
    if (options.route && componentName) {
      config.routes.push({
        path: options.route,
        componentName: componentName,
        online: true,
        offline: true,
      });

      // Show URL info for the provided route
      if (!isNonInteractive) {
        console.log(
          chalk.cyan(
            `📍 Your module will be available at: http://localhost:8080/openmrs/spa${options.route}`
          )
        );
      }
    } else {
      // Always create a default route when no route flags provided (avoids hanging prompts)
      const defaultRoute = `/${projectConfig.projectName}`;
      const defaultComponent = projectConfig.projectName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');

      config.routes.push({
        path: defaultRoute,
        componentName: defaultComponent,
        online: true,
        offline: true,
      });

      // Show URL info for the created route
      if (!isNonInteractive) {
        console.log(
          chalk.cyan(
            `📍 Your module will be available at: http://localhost:8080/openmrs/spa${defaultRoute}`
          )
        );
      }

      // Only prompt for more routes in truly interactive mode (not when defaulting)
      if (!isNonInteractive && process.stdin.isTTY) {
        // This is a truly interactive session - could prompt for more routes
        // But for now, we'll skip to avoid hanging
      }
    }
  }

  // Extensions (if extension or both)
  if (config.type === 'extension' || config.type === 'both') {
    config.extensions = [];
    let addMore = true;
    while (addMore) {
      const extension = await prompts({
        type: 'text',
        name: 'name',
        message: 'Extension name:',
        validate: (value: string) => {
          if (!value) return 'Extension name is required';
          const validation = validateExtensionName(value);
          if (!validation.success) {
            return validation.errors[0] || 'Invalid extension name';
          }
          return true;
        },
      });
      const slot = await prompts({
        type: 'text',
        name: 'name',
        message: 'Slot name:',
        validate: (value: string) => {
          if (!value) return 'Slot name is required';
          const validation = validateSlotName(value);
          if (!validation.success) {
            return validation.errors[0] || 'Invalid slot name';
          }
          return true;
        },
      });
      const component = await prompts({
        type: 'text',
        name: 'name',
        message: 'Component name:',
        validate: (value: string) => {
          if (!value) return 'Component name is required';
          const validation = validateComponentName(value);
          if (!validation.success) {
            return validation.errors[0] || 'Invalid component name';
          }
          return true;
        },
      });
      config.extensions.push({
        name: extension.name,
        slot: slot.name,
        componentName: component.name,
        online: true,
        offline: true,
      });
      const more = await prompts({
        type: 'confirm',
        name: 'addMore',
        message: 'Add more extensions?',
        initial: false,
      });
      addMore = more.addMore;
    }
  }

  // Modals (skip prompt if in non-interactive mode)
  if (!isNonInteractive) {
    const modalsResponse = await prompts({
      type: 'confirm',
      name: 'create',
      message: 'Do you want to create modals?',
      initial: false,
    });
    if (modalsResponse.create) {
      config.modals = [];
      // TODO: Prompt for modals
    }
  } else {
    config.modals = undefined;
  }

  // Workspaces (skip prompt if in non-interactive mode)
  if (!isNonInteractive) {
    const workspacesResponse = await prompts({
      type: 'confirm',
      name: 'create',
      message: 'Do you want to create workspaces?',
      initial: false,
    });
    if (workspacesResponse.create) {
      config.workspaces = [];
      // TODO: Prompt for workspaces
    }
  } else {
    config.workspaces = undefined;
  }

  // Feature flags (skip prompt if in non-interactive mode)
  if (!isNonInteractive) {
    const featureFlagsResponse = await prompts({
      type: 'confirm',
      name: 'create',
      message: 'Do you want to define feature flags?',
      initial: false,
    });
    if (featureFlagsResponse.create) {
      config.featureFlags = [];
      // TODO: Prompt for feature flags
    }
  } else {
    config.featureFlags = undefined;
  }

  // Backend dependencies (skip if non-interactive mode)
  if (!isNonInteractive) {
    const backendDeps = await prompts({
      type: 'text',
      name: 'dependencies',
      message: 'Backend dependencies (comma-separated, e.g., "webservices.rest>=2.24.0"):',
      initial: '',
      validate: (value: string) => {
        if (!value) return true; // Optional
        const deps = value
          .split(',')
          .map((d: string) => d.trim())
          .filter(Boolean);
        for (const dep of deps) {
          const validation = validateBackendDependency(dep);
          if (!validation.success) {
            return `${dep}: ${validation.errors[0] || 'Invalid format'}`;
          }
        }
        return true;
      },
    });
    if (backendDeps.dependencies) {
      config.backendDependencies = (backendDeps.dependencies as string)
        .split(',')
        .map((d: string) => d.trim())
        .filter(Boolean);
    }
  } else {
    config.backendDependencies = undefined;
  }

  // Optional features (use defaults in non-interactive mode, prompt otherwise)
  if (isNonInteractive) {
    // Use sensible defaults when non-interactive
    config.offline = false;
    config.errorBoundary = false;
    config.pathAliases = undefined;
    config.coverageThresholds = true;
    config.accessibility = true;
    config.dependabot = true;
    config.contributing = true;
    config.turbo = false;
  } else {
    config.offline = (
      await prompts({
        type: 'confirm',
        name: 'offline',
        message: 'Add offline support?',
        initial: false,
      })
    ).offline;

    config.errorBoundary = (
      await prompts({
        type: 'confirm',
        name: 'errorBoundary',
        message: 'Generate error boundary component?',
        initial: false,
      })
    ).errorBoundary;

    config.pathAliases = (
      await prompts({
        type: 'confirm',
        name: 'pathAliases',
        message: 'Set up path aliases for hooks/resources/utils?',
        initial: false,
      })
    ).pathAliases
      ? ['hooks', 'resources', 'utils']
      : undefined;

    config.coverageThresholds = (
      await prompts({
        type: 'confirm',
        name: 'coverage',
        message: 'Set up test coverage thresholds?',
        initial: true,
      })
    ).coverage;

    config.accessibility = (
      await prompts({
        type: 'confirm',
        name: 'accessibility',
        message: 'Add eslint-plugin-jsx-a11y for accessibility?',
        initial: true,
      })
    ).accessibility;

    config.dependabot = (
      await prompts({
        type: 'confirm',
        name: 'dependabot',
        message: 'Set up Dependabot for dependency updates?',
        initial: true,
      })
    ).dependabot;

    config.contributing = (
      await prompts({
        type: 'confirm',
        name: 'contributing',
        message: 'Generate CONTRIBUTING.md?',
        initial: true,
      })
    ).contributing;

    config.turbo = (
      await prompts({
        type: 'confirm',
        name: 'turbo',
        message: 'Include turbo.json for consistent commands?',
        initial: false,
      })
    ).turbo;
  }

  return config;
}
