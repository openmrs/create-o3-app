import prompts from 'prompts';
import chalk from 'chalk';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';
import {
  validateComponentName,
  validateExtensionName,
  validateFeatureFlagName,
  validateSlotName,
  validateBackendDependency,
  validateWorkspaceName,
} from '../../validators/index.js';

export async function promptModuleConfig(
  projectConfig: ProjectConfig,
  options: CreateOptions
): Promise<ModuleConfig> {
  // Check if we're in non-interactive mode (CI, no TTY, or flags provided)
  const componentName = options.routeComponent;
  const isNonInteractive =
    options.quiet ||
    process.env.CI === 'true' ||
    !process.stdin.isTTY ||
    options.standalone ||
    options.monorepo ||
    options.newMonorepo ||
    (options.route && componentName);

  // Determine module type from options
  // If route/component provided, assume 'page'
  // Otherwise prompt (unless non-interactive, in which case default to 'page')
  let moduleType: 'page' | 'extension' | 'both' | 'modal' = 'page';

  if (options.route || componentName) {
    moduleType = 'page';
  } else if (!isNonInteractive) {
    const response = await prompts({
      type: 'select',
      name: 'moduleType',
      message: 'Module type:',
      choices: [
        { title: 'Page', value: 'page', description: 'A routable page component' },
        {
          title: 'Extension',
          value: 'extension',
          description: 'An extension that slots into existing UI',
        },
        { title: 'Both', value: 'both', description: 'A page with extensions' },
      ],
      initial: 0,
    });
    moduleType = response.moduleType ?? 'page';
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
      let addMore = true;
      while (addMore) {
        const modal = await prompts({
          type: 'text',
          name: 'name',
          message: 'Modal name:',
          validate: (value: string) => {
            if (!value) return 'Modal name is required';
            const validation = validateExtensionName(value);
            if (!validation.success) {
              return validation.errors[0] || 'Invalid modal name';
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
        config.modals.push({
          name: modal.name,
          componentName: component.name,
        });
        const more = await prompts({
          type: 'confirm',
          name: 'addMore',
          message: 'Add more modals?',
          initial: false,
        });
        addMore = more.addMore;
      }
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
      let addMore = true;
      while (addMore) {
        const workspace = await prompts({
          type: 'text',
          name: 'name',
          message: 'Workspace name:',
          validate: (value: string) => {
            if (!value) return 'Workspace name is required';
            const validation = validateWorkspaceName(value);
            if (!validation.success) {
              return validation.errors[0] || 'Invalid workspace name';
            }
            return true;
          },
        });
        const title = await prompts({
          type: 'text',
          name: 'title',
          message: 'Workspace title:',
          validate: (value: string) => (value ? true : 'Workspace title is required'),
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
        const workspaceType = await prompts({
          type: 'text',
          name: 'type',
          message: 'Workspace type:',
          initial: 'form',
          validate: (value: string) => (value.trim() ? true : 'Workspace type is required'),
        });
        config.workspaces.push({
          name: workspace.name,
          title: title.title,
          componentName: component.name,
          type: workspaceType.type.trim(),
        });
        const more = await prompts({
          type: 'confirm',
          name: 'addMore',
          message: 'Add more workspaces?',
          initial: false,
        });
        addMore = more.addMore;
      }
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
      let addMore = true;
      while (addMore) {
        const flag = await prompts({
          type: 'text',
          name: 'name',
          message: 'Feature flag name:',
          validate: (value: string) => {
            if (!value) return 'Feature flag name is required';
            const validation = validateFeatureFlagName(value);
            if (!validation.success) {
              return validation.errors[0] || 'Invalid feature flag name';
            }
            return true;
          },
        });
        const label = await prompts({
          type: 'text',
          name: 'label',
          message: 'Feature flag label:',
          validate: (value: string) => (value ? true : 'Feature flag label is required'),
        });
        const description = await prompts({
          type: 'text',
          name: 'description',
          message: 'Feature flag description:',
          validate: (value: string) => (value ? true : 'Feature flag description is required'),
        });
        config.featureFlags.push({
          name: flag.name,
          label: label.label,
          description: description.description,
        });
        const more = await prompts({
          type: 'confirm',
          name: 'addMore',
          message: 'Add more feature flags?',
          initial: false,
        });
        addMore = more.addMore;
      }
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
        .filter(Boolean)
        .map((dep: string) => {
          const match = dep.match(/^([a-z0-9-_.]+)(>=|@)(.+)$/);
          if (match) {
            return { name: match[1], version: `${match[2] === '>=' ? '>=' : ''}${match[3]}` };
          }
          return { name: dep, version: '>=0.0.0' };
        });
    }
  } else {
    config.backendDependencies = undefined;
  }

  // Optional features (use defaults in non-interactive mode, prompt otherwise)
  if (isNonInteractive) {
    // Use sensible defaults when non-interactive
    config.offline = false;
    config.pathAliases = undefined;
    config.coverageThresholds = true;
  } else {
    config.offline = (
      await prompts({
        type: 'confirm',
        name: 'offline',
        message: 'Add offline support?',
        initial: false,
      })
    ).offline;

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
  }

  // Apply the offline support answer to the generated routes and extensions
  const offline = config.offline ?? false;
  config.routes?.forEach((route) => {
    route.offline = offline;
  });
  config.extensions?.forEach((extension) => {
    extension.offline = offline;
  });

  return config;
}
