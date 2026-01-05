import {
  projectNameSchema,
  packageNameSchema,
  descriptionSchema,
  buildToolSchema,
  templateVersionSchema,
  routePathSchema,
  componentNameSchema,
  extensionNameSchema,
  slotNameSchema,
  backendDependencySchema,
  pathAliasSchema,
  workspaceNameSchema,
  featureFlagNameSchema,
  packageLocationSchema,
  projectConfigSchema,
  moduleConfigSchema,
  createOptionsSchema,
} from './schemas.js';
import type { ProjectConfig, ModuleConfig, CreateOptions } from '../types/index.js';

/**
 * Validation result
 */
export interface ValidationResult {
  success: boolean;
  errors: string[];
}

/**
 * Validate project name
 */
export function validateProjectName(name: string): ValidationResult {
  try {
    projectNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error && typeof error === 'object' && 'issues' in error) {
      const zodError = error as { issues: Array<{ message: string; code: string }> };
      const messages = zodError.issues.map((issue) => {
        if (issue.code === 'invalid_string' && name.includes(' ')) {
          return 'Project name cannot contain spaces. Use kebab-case: "my-module" instead of "my module"';
        }
        if (issue.code === 'invalid_string' && /[A-Z]/.test(name)) {
          return 'Project name must be lowercase. Use "my-module" instead of "MyModule"';
        }
        return issue.message;
      });
      return { success: false, errors: messages };
    }
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid project name'] };
  }
}

/**
 * Validate package name
 */
export function validatePackageName(name: string): ValidationResult {
  try {
    packageNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid package name'] };
  }
}

/**
 * Validate description
 */
export function validateDescription(description: string): ValidationResult {
  try {
    descriptionSchema.parse(description);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid description'] };
  }
}

/**
 * Validate build tool
 */
export function validateBuildTool(tool: string): ValidationResult {
  try {
    buildToolSchema.parse(tool);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid build tool'] };
  }
}

/**
 * Validate template version
 */
export function validateTemplateVersion(version: string): ValidationResult {
  try {
    templateVersionSchema.parse(version);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid template version'] };
  }
}

/**
 * Validate route path
 */
export function validateRoutePath(path: string): ValidationResult {
  try {
    routePathSchema.parse(path);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid route path'] };
  }
}

/**
 * Validate component name
 */
export function validateComponentName(name: string): ValidationResult {
  try {
    componentNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid component name'] };
  }
}

/**
 * Validate extension name
 */
export function validateExtensionName(name: string): ValidationResult {
  try {
    extensionNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid extension name'] };
  }
}

/**
 * Validate slot name
 */
export function validateSlotName(name: string): ValidationResult {
  try {
    slotNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid slot name'] };
  }
}

/**
 * Validate backend dependency
 */
export function validateBackendDependency(dep: string): ValidationResult {
  try {
    backendDependencySchema.parse(dep);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid backend dependency format'] };
  }
}

/**
 * Validate path alias
 */
export function validatePathAlias(alias: string): ValidationResult {
  try {
    pathAliasSchema.parse(alias);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid path alias'] };
  }
}

/**
 * Validate workspace name
 */
export function validateWorkspaceName(name: string): ValidationResult {
  try {
    workspaceNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid workspace name'] };
  }
}

/**
 * Validate feature flag name
 */
export function validateFeatureFlagName(name: string): ValidationResult {
  try {
    featureFlagNameSchema.parse(name);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid feature flag name'] };
  }
}

/**
 * Validate package location
 */
export function validatePackageLocation(location: string): ValidationResult {
  try {
    packageLocationSchema.parse(location);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    return { success: false, errors: ['Invalid package location'] };
  }
}

/**
 * Validate complete project configuration
 */
export function validateProjectConfig(config: unknown): ValidationResult {
  try {
    projectConfigSchema.parse(config);
    return { success: true, errors: [] };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, errors: [error.message] };
    }
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      const messages = zodError.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors: messages };
    }
    return { success: false, errors: ['Invalid project configuration'] };
  }
}

/**
 * Validate complete module configuration
 */
export function validateModuleConfig(config: unknown): ValidationResult {
  try {
    moduleConfigSchema.parse(config);
    return { success: true, errors: [] };
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      const messages = zodError.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      return { success: false, errors: messages };
    }
    return { success: false, errors: ['Invalid module configuration'] };
  }
}

/**
 * Validate mutually exclusive flags and dependencies
 */
function validateFlagConstraints(options: CreateOptions): ValidationResult {
  const errors: string[] = [];

  // Check mutually exclusive project type flags
  const projectTypeFlags = [
    options.standalone && '--standalone',
    options.monorepo && '--monorepo',
    options.newMonorepo && '--new-monorepo',
  ].filter(Boolean) as string[];

  if (projectTypeFlags.length > 1) {
    errors.push(
      `Cannot specify multiple project type flags: ${projectTypeFlags.join(', ')}. ` +
        'Please choose only one: --standalone, --monorepo, or --new-monorepo.'
    );
  }

  // Check route flags dependency
  const hasRouteComponent = Boolean(options.routeComponent);
  const hasRoutePath = Boolean(options.route);

  if (hasRoutePath && !hasRouteComponent) {
    errors.push(
      `--route requires --route-component. ` +
        'Please provide both: --route "/path" --route-component "ComponentName"'
    );
  }

  if (hasRouteComponent && !hasRoutePath) {
    errors.push(
      `--route-component requires --route. ` +
        'Please provide both: --route "/path" --route-component "ComponentName"'
    );
  }

  // Check verbose/quiet mutual exclusivity
  if (options.verbose && options.quiet) {
    errors.push('Cannot specify both --verbose and --quiet. Please choose only one.');
  }

  return {
    success: errors.length === 0,
    errors,
  };
}

/**
 * Validate create options
 */
export function validateCreateOptions(options: unknown): ValidationResult {
  // First validate with Zod schema
  let zodResult: ValidationResult;
  try {
    createOptionsSchema.parse(options);
    zodResult = { success: true, errors: [] };
  } catch (error) {
    if (error && typeof error === 'object' && 'errors' in error) {
      const zodError = error as { errors: Array<{ message: string; path: (string | number)[] }> };
      const messages = zodError.errors.map((err) => {
        const path = err.path.join('.');
        return path ? `${path}: ${err.message}` : err.message;
      });
      zodResult = { success: false, errors: messages };
    } else {
      zodResult = { success: false, errors: ['Invalid create options'] };
    }
  }

  // Then validate flag constraints
  const constraintResult = validateFlagConstraints(options as CreateOptions);

  // Combine errors
  if (!zodResult.success || !constraintResult.success) {
    return {
      success: false,
      errors: [...zodResult.errors, ...constraintResult.errors],
    };
  }

  return { success: true, errors: [] };
}

/**
 * Parse and validate project config (returns typed config or throws)
 */
export function parseProjectConfig(config: unknown): ProjectConfig {
  return projectConfigSchema.parse(config) as ProjectConfig;
}

/**
 * Parse and validate module config (returns typed config or throws)
 */
export function parseModuleConfig(config: unknown): ModuleConfig {
  return moduleConfigSchema.parse(config) as ModuleConfig;
}

/**
 * Parse and validate create options (returns typed options or throws)
 */
export function parseCreateOptions(options: unknown): CreateOptions {
  return createOptionsSchema.parse(options) as CreateOptions;
}
