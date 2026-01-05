import { z } from 'zod';

/**
 * Project name validation schema
 * Must be a valid npm package name segment
 */
export const projectNameSchema = z
  .string()
  .min(1, 'Project name is required')
  .max(214, 'Project name is too long (max 214 characters)')
  .regex(/^[a-z0-9-]+$/, 'Project name can only contain lowercase letters, numbers, and hyphens')
  .refine((name) => !name.startsWith('-') && !name.endsWith('-'), {
    message: 'Project name cannot start or end with a hyphen',
  });

/**
 * Package name validation schema
 * Must be a valid npm package name
 */
export const packageNameSchema = z
  .string()
  .min(1, 'Package name is required')
  .max(214, 'Package name is too long (max 214 characters)')
  .regex(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/, 'Invalid package name format');

/**
 * Description validation schema
 */
export const descriptionSchema = z
  .string()
  .min(1, 'Description is required')
  .max(500, 'Description is too long (max 500 characters)');

/**
 * Build tool validation schema
 */
export const buildToolSchema = z.enum(['webpack', 'rspack'], {
  errorMap: () => ({ message: 'Build tool must be either "webpack" or "rspack"' }),
});

/**
 * Template version validation schema
 */
export const templateVersionSchema = z
  .string()
  .min(1, 'Template version is required')
  .refine(
    (version) => {
      // Allow 'latest', 'next', or semantic version format
      if (version === 'latest' || version === 'next') {
        return true;
      }
      // Check if it's a valid semver or git tag
      return /^[\w.-]+$/.test(version);
    },
    {
      message: 'Template version must be "latest", "next", or a valid version/tag',
    }
  );

/**
 * Route path validation schema
 */
export const routePathSchema = z
  .string()
  .min(1, 'Route path is required')
  .regex(
    /^\/?[a-z0-9/-]+$/,
    'Route path can only contain lowercase letters, numbers, slashes, and hyphens'
  )
  .refine((path) => !path.endsWith('/'), {
    message: 'Route path cannot end with a slash',
  });

/**
 * Component name validation schema
 * Must be a valid JavaScript identifier (PascalCase recommended)
 */
export const componentNameSchema = z
  .string()
  .min(1, 'Component name is required')
  .regex(/^[A-Z][a-zA-Z0-9]*$/, 'Component name must be PascalCase (e.g., MyComponent)');

/**
 * Extension name validation schema
 */
export const extensionNameSchema = z
  .string()
  .min(1, 'Extension name is required')
  .regex(/^[a-z0-9-]+$/, 'Extension name can only contain lowercase letters, numbers, and hyphens');

/**
 * Slot name validation schema
 */
export const slotNameSchema = z
  .string()
  .min(1, 'Slot name is required')
  .regex(/^[a-z0-9-]+$/, 'Slot name can only contain lowercase letters, numbers, and hyphens');

/**
 * Backend dependency validation schema
 * Format: "module-name>=version" or "module-name@version"
 */
export const backendDependencySchema = z
  .string()
  .regex(
    /^[a-z0-9-_.]+(>=|@)[\d.]+$/,
    'Backend dependency must be in format "module-name>=version" or "module-name@version"'
  );

/**
 * Path alias validation schema
 */
export const pathAliasSchema = z
  .string()
  .min(1, 'Path alias is required')
  .regex(/^[a-z0-9-]+$/, 'Path alias can only contain lowercase letters, numbers, and hyphens');

/**
 * Workspace name validation schema
 */
export const workspaceNameSchema = z
  .string()
  .min(1, 'Workspace name is required')
  .regex(/^[a-z0-9-]+$/, 'Workspace name can only contain lowercase letters, numbers, and hyphens');

/**
 * Feature flag name validation schema
 */
export const featureFlagNameSchema = z
  .string()
  .min(1, 'Feature flag name is required')
  .regex(
    /^[a-z0-9-]+$/,
    'Feature flag name can only contain lowercase letters, numbers, and hyphens'
  );

/**
 * Package location validation schema (for monorepo)
 */
export const packageLocationSchema = z
  .string()
  .min(1, 'Package location is required')
  .regex(
    /^[a-z0-9/_-]+$/,
    'Package location can only contain lowercase letters, numbers, slashes, hyphens, and underscores'
  )
  .refine((path) => !path.startsWith('/') && !path.endsWith('/'), {
    message: 'Package location cannot start or end with a slash',
  });

/**
 * Complete project configuration validation schema
 */
export const projectConfigSchema = z.object({
  projectName: projectNameSchema,
  packageName: packageNameSchema,
  description: descriptionSchema,
  buildTool: buildToolSchema,
  isMonorepo: z.boolean(),
  isNewMonorepo: z.boolean(),
  packageLocation: packageLocationSchema.optional(),
  git: z.boolean(),
  ci: z.boolean(),
});

/**
 * Route configuration validation schema
 */
export const routeConfigSchema = z.object({
  path: routePathSchema,
  componentName: componentNameSchema,
  online: z.boolean().optional(),
  offline: z.boolean().optional(),
});

/**
 * Extension configuration validation schema
 */
export const extensionConfigSchema = z.object({
  name: extensionNameSchema,
  slot: slotNameSchema,
  componentName: componentNameSchema,
  order: z.number().int().min(0).optional(),
  online: z.boolean().optional(),
  offline: z.boolean().optional(),
  featureFlag: z.string().optional(),
});

/**
 * Modal configuration validation schema
 */
export const modalConfigSchema = z.object({
  name: extensionNameSchema, // Same format as extension name
  componentName: componentNameSchema,
});

/**
 * Workspace configuration validation schema
 */
export const workspaceConfigSchema = z.object({
  name: workspaceNameSchema,
  title: z.string().min(1, 'Workspace title is required'),
  componentName: componentNameSchema,
  type: z.enum(['form', 'chart', 'other']),
});

/**
 * Feature flag configuration validation schema
 */
export const featureFlagConfigSchema = z.object({
  name: featureFlagNameSchema,
  label: z.string().min(1, 'Feature flag label is required'),
  description: z.string().min(1, 'Feature flag description is required'),
});

/**
 * Complete module configuration validation schema
 */
export const moduleConfigSchema = z.object({
  type: z.enum(['page', 'extension', 'both', 'modal']),
  routes: z.array(routeConfigSchema).optional(),
  extensions: z.array(extensionConfigSchema).optional(),
  modals: z.array(modalConfigSchema).optional(),
  workspaces: z.array(workspaceConfigSchema).optional(),
  featureFlags: z.array(featureFlagConfigSchema).optional(),
  backendDependencies: z.array(backendDependencySchema).optional(),
  offline: z.boolean().optional(),
  errorBoundary: z.boolean().optional(),
  pathAliases: z.array(pathAliasSchema).optional(),
  coverageThresholds: z.boolean().optional(),
  accessibility: z.boolean().optional(),
  dependabot: z.boolean().optional(),
  contributing: z.boolean().optional(),
  turbo: z.boolean().optional(),
});

/**
 * Create options validation schema
 */
export const createOptionsSchema = z.object({
  packageName: packageNameSchema.optional(),
  rspack: z.boolean().optional(),
  standalone: z.boolean().optional(),
  monorepo: z.boolean().optional(),
  newMonorepo: z.boolean().optional(),
  route: routePathSchema.optional(),
  routeComponent: componentNameSchema.optional(),
  git: z.boolean().optional(),
  ci: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  verbose: z.boolean().optional(),
  quiet: z.boolean().optional(),
});
