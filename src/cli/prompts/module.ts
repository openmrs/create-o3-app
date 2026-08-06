import prompts from 'prompts';
import chalk from 'chalk';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../../types/index.js';
import { OutputFileClaims, type ComponentKind } from '../../templates/naming.js';
import {
  validateComponentName,
  validateExtensionName,
  validateFeatureFlagName,
  validateSlotName,
  validateBackendDependency,
  validateWorkspaceName,
} from '../../validators/index.js';

/** A prompts response is missing its answer when the user cancelled (Ctrl-C). */
function cancelled(answer: unknown): boolean {
  return answer === undefined;
}

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

  // Tracks generated output files so a later prompt answer cannot silently
  // overwrite an earlier component's files; the engine re-checks at
  // generation time as a backstop
  const fileClaims = new OutputFileClaims();
  const componentNameValidator = (kind: ComponentKind) => (value: string) => {
    if (!value) return 'Component name is required';
    const validation = validateComponentName(value);
    if (!validation.success) {
      return validation.errors[0] || 'Invalid component name';
    }
    const collision = fileClaims.check(kind, value);
    if (collision) {
      return collision;
    }
    return true;
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

    // Seed the claims so later prompts validate against the route components
    // (collisions here, e.g. a component named Root, are caught by the engine)
    config.routes.forEach((route) => fileClaims.claim('page', route.componentName));
  }

  // Extensions (if extension or both)
  if (config.type === 'extension' || config.type === 'both') {
    config.extensions = [];
    const usedNames = new Set<string>();
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
          if (usedNames.has(value)) {
            return `An extension named "${value}" is already defined`;
          }
          return true;
        },
      });
      if (cancelled(extension.name)) break;
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
      if (cancelled(slot.name)) break;
      const component = await prompts({
        type: 'text',
        name: 'name',
        message: 'Component name:',
        validate: componentNameValidator('extension'),
      });
      if (cancelled(component.name)) break;
      config.extensions.push({
        name: extension.name,
        slot: slot.name,
        componentName: component.name,
        online: true,
      });
      usedNames.add(extension.name);
      fileClaims.claim('extension', component.name);
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
      const usedNames = new Set<string>();
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
            if (usedNames.has(value)) {
              return `A modal named "${value}" is already defined`;
            }
            return true;
          },
        });
        if (cancelled(modal.name)) break;
        const component = await prompts({
          type: 'text',
          name: 'name',
          message: 'Component name:',
          validate: componentNameValidator('modal'),
        });
        if (cancelled(component.name)) break;
        config.modals.push({
          name: modal.name,
          componentName: component.name,
        });
        usedNames.add(modal.name);
        fileClaims.claim('modal', component.name);
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
      const usedNames = new Set<string>();
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
            if (usedNames.has(value)) {
              return `A workspace named "${value}" is already defined`;
            }
            return true;
          },
        });
        if (cancelled(workspace.name)) break;
        const title = await prompts({
          type: 'text',
          name: 'title',
          message: 'Workspace title:',
          validate: (value: string) => (value ? true : 'Workspace title is required'),
        });
        if (cancelled(title.title)) break;
        const component = await prompts({
          type: 'text',
          name: 'name',
          message: 'Component name:',
          validate: componentNameValidator('workspace'),
        });
        if (cancelled(component.name)) break;
        const workspaceType = await prompts({
          type: 'text',
          name: 'type',
          message: 'Workspace type:',
          initial: 'form',
          validate: (value: string) => (value.trim() ? true : 'Workspace type is required'),
        });
        if (cancelled(workspaceType.type)) break;
        config.workspaces.push({
          name: workspace.name,
          title: title.title,
          componentName: component.name,
          type: workspaceType.type.trim(),
        });
        usedNames.add(workspace.name);
        fileClaims.claim('workspace', component.name);
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
      const usedNames = new Set<string>();
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
            if (usedNames.has(value)) {
              return `A feature flag named "${value}" is already defined`;
            }
            return true;
          },
        });
        if (cancelled(flag.name)) break;
        const label = await prompts({
          type: 'text',
          name: 'label',
          message: 'Feature flag label:',
          validate: (value: string) => (value ? true : 'Feature flag label is required'),
        });
        if (cancelled(label.label)) break;
        const description = await prompts({
          type: 'text',
          name: 'description',
          message: 'Feature flag description:',
          validate: (value: string) => (value ? true : 'Feature flag description is required'),
        });
        if (cancelled(description.description)) break;
        config.featureFlags.push({
          name: flag.name,
          label: label.label,
          description: description.description,
        });
        usedNames.add(flag.name);
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
  } else {
    config.offline = (
      await prompts({
        type: 'confirm',
        name: 'offline',
        message: 'Add offline support?',
        initial: false,
      })
    ).offline;
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
