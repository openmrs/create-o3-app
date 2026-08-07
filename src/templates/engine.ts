import Handlebars from 'handlebars';
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { globby } from 'globby';
import type {
  ProjectConfig,
  ModuleConfig,
  CreateOptions,
  RouteConfig,
  ExtensionConfig,
  ModalConfig,
  WorkspaceConfig,
} from '../types/index.js';
import { getTemplateInfo } from './loader.js';
import { ValidationError } from '../utils/errors.js';
import { componentFileBaseName, OutputFileClaims, type ComponentKind } from './naming.js';

export interface TemplateContext extends ProjectConfig {
  module: ModuleConfig;
  options: CreateOptions;
  /** The CLI that generated the module, e.g. `@openmrs/create-o3-app@1.1.0` */
  generator: string;
  /** Modals and workspaces enriched with the derived output file basename */
  modals?: Array<ModalConfig & { fileBaseName: string }>;
  workspaces?: Array<WorkspaceConfig & { fileBaseName: string }>;
  /** Scope pattern for the generated workspace group (the module's first route) */
  workspaceScopePattern: string;
  // Helper fields
  kebabCase: (str: string) => string;
  camelCase: (str: string) => string;
  pascalCase: (str: string) => string;
  snakeCase: (str: string) => string;
}

/**
 * Register Handlebars helpers
 */
function registerHelpers(): void {
  // Kebab case: myModule -> my-module
  Handlebars.registerHelper('kebabCase', (str: string) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  });

  // Camel case: my-module -> myModule
  Handlebars.registerHelper('camelCase', (str: string) => {
    return str
      .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
  });

  // Pascal case: my-module -> MyModule
  Handlebars.registerHelper('pascalCase', (str: string) => {
    const camel = Handlebars.helpers.camelCase(str) as string;
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  });

  // Snake case: my-module -> my_module
  Handlebars.registerHelper('snakeCase', (str: string) => {
    return str.replace(/-/g, '_').toLowerCase();
  });

  // Conditional helper
  Handlebars.registerHelper(
    'if_eq',
    function (this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    }
  );

  // JSON stringify
  Handlebars.registerHelper('json', (context: unknown) => {
    return JSON.stringify(context, null, 2);
  });

  // String starts with (returns boolean for use in subexpressions)
  Handlebars.registerHelper('startsWith', (str: string, prefix: string) => {
    return typeof str === 'string' && str.startsWith(prefix);
  });

  // String substring
  Handlebars.registerHelper('substring', (str: string, start: number, end?: number) => {
    if (typeof str !== 'string') return '';
    const startNum = typeof start === 'number' ? start : parseInt(String(start), 10);
    if (end !== undefined && typeof end === 'number') {
      return str.substring(startNum, end);
    }
    return str.substring(startNum);
  });
}

// Register helpers once
registerHelpers();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * The generator label stamped into generated package.json files, e.g.
 * `@openmrs/create-o3-app@1.1.0`. The CLI's own package.json sits one level
 * above the bundled dist/index.js in the published package and two levels
 * above this file in the source tree. The name check guards against reading
 * some other package.json by accident.
 */
function getGeneratorLabel(): string {
  for (const candidate of [
    join(__dirname, '..', 'package.json'),
    join(__dirname, '..', '..', 'package.json'),
  ]) {
    try {
      const pkg = JSON.parse(readFileSync(candidate, 'utf-8')) as {
        name?: string;
        version?: string;
      };
      if (pkg.name === '@openmrs/create-o3-app' && pkg.version) {
        return `${pkg.name}@${pkg.version}`;
      }
    } catch {
      // Try the next candidate
    }
  }
  return '@openmrs/create-o3-app';
}

const generatorLabel = getGeneratorLabel();

/**
 * Fail fast when two configured entries would generate the same output file.
 * See OutputFileClaims for the collision classes this guards against.
 */
function assertNoOutputCollisions(moduleConfig: ModuleConfig): void {
  const claims = new OutputFileClaims();
  const claimOrThrow = (kind: ComponentKind, name: string) => {
    const error = claims.claim(kind, name);
    if (error) {
      throw new ValidationError(error, 'componentName');
    }
  };

  for (const route of moduleConfig.routes ?? []) {
    claimOrThrow('page', route.componentName);
  }
  for (const extension of moduleConfig.extensions ?? []) {
    claimOrThrow('extension', extension.componentName);
  }
  for (const modal of moduleConfig.modals ?? []) {
    claimOrThrow('modal', modal.componentName);
  }
  for (const workspace of moduleConfig.workspaces ?? []) {
    claimOrThrow('workspace', workspace.componentName);
  }
}

/**
 * Build template context
 */
function buildContext(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions
): TemplateContext {
  return {
    ...projectConfig,
    ...moduleConfig,
    modals: moduleConfig.modals?.map((modal) => ({
      ...modal,
      fileBaseName: componentFileBaseName(modal.componentName, 'Modal'),
    })),
    workspaces: moduleConfig.workspaces?.map((workspace) => ({
      ...workspace,
      fileBaseName: componentFileBaseName(workspace.componentName, 'Workspace'),
    })),
    module: moduleConfig,
    options,
    generator: generatorLabel,
    workspaceScopePattern: (() => {
      const firstRoute = moduleConfig.routes?.[0]?.path ?? '/';
      const path = firstRoute.startsWith('/') ? firstRoute : `/${firstRoute}`;
      return `^${path}`;
    })(),
    kebabCase: (str: string) =>
      str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/[\s_]+/g, '-')
        .toLowerCase(),
    camelCase: (str: string) =>
      str
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^[A-Z]/, (letter) => letter.toLowerCase()),
    pascalCase: (str: string) => {
      const camel = str
        .replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
      return camel.charAt(0).toUpperCase() + camel.slice(1);
    },
    snakeCase: (str: string) => str.replace(/-/g, '_').toLowerCase(),
  };
}

/**
 * Check if a file should be excluded from generation
 */
function shouldExcludeFile(filePath: string, projectConfig: ProjectConfig): boolean {
  const relativePath = filePath;
  const excludePatterns = [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.cache',
    'coverage',
    '.DS_Store',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
  ];

  // Git hooks belong to the repository root; a package inside a monorepo must
  // not ship .husky (its postinstall cannot use the root .git anyway)
  if (projectConfig.isMonorepo && relativePath.includes('.husky')) {
    return true;
  }

  // Exclude the build tool config file that doesn't match the selected buildTool
  if (projectConfig.buildTool === 'rspack' && relativePath.includes('webpack.config.js')) {
    return true;
  }
  if (projectConfig.buildTool === 'webpack' && relativePath.includes('rspack.config.js')) {
    return true;
  }

  return excludePatterns.some((pattern) => relativePath.includes(pattern));
}

/**
 * Render a single template file
 */
function renderFile(
  templatePath: string,
  outputPath: string,
  context: TemplateContext,
  isDryRun: boolean
): void {
  const content = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(content);
  const rendered = template(context);

  if (isDryRun) {
    console.log(`[DRY RUN] Would create: ${outputPath}`);
    return;
  }

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Write file
  writeFileSync(outputPath, rendered, 'utf-8');
}

/**
 * Render a component file with specific context
 */
function renderComponentFile(
  templatePath: string,
  outputPath: string,
  context: TemplateContext & {
    currentRoute?: RouteConfig;
    currentExtension?: ExtensionConfig;
    currentModal?: ModalConfig & { fileBaseName: string };
    currentWorkspace?: WorkspaceConfig & { fileBaseName: string };
  },
  isDryRun: boolean
): void {
  const content = readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(content);
  const rendered = template(context);

  if (isDryRun) {
    console.log(`[DRY RUN] Would create: ${outputPath}`);
    return;
  }

  // Ensure directory exists
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // Write file
  writeFileSync(outputPath, rendered, 'utf-8');
}

/**
 * Generate files from template
 * @returns Number of files generated
 */
export async function generateFiles(
  projectConfig: ProjectConfig,
  moduleConfig: ModuleConfig,
  options: CreateOptions,
  baseDir: string = process.cwd()
): Promise<number> {
  // Fail fast if any two components would generate the same output file
  assertNoOutputCollisions(moduleConfig);

  // Get template info (templates are now embedded, version ignored)
  const templateInfo = await getTemplateInfo();

  // Build context
  const context = buildContext(projectConfig, moduleConfig, options);

  // Determine output directory
  const outputDir = projectConfig.packageLocation
    ? join(baseDir, projectConfig.packageLocation)
    : join(baseDir, projectConfig.projectName);

  // Find all template files
  const templateFiles = await globby(['**/*'], {
    cwd: templateInfo.path,
    dot: true,
    ignore: ['node_modules/**', '.git/**', 'dist/**', 'build/**'],
  });

  // Filter out excluded files
  const filesToGenerate = templateFiles.filter((file) => !shouldExcludeFile(file, projectConfig));

  // Generate each file
  let fileCount = 0;
  for (const templateFile of filesToGenerate) {
    const templatePath = join(templateInfo.path, templateFile);

    // Skip if it's a directory
    if (existsSync(templatePath)) {
      const stat = statSync(templatePath);
      if (stat.isDirectory()) {
        continue;
      }
    }

    // Handle dynamic component generation
    if (templateFile === 'src/page.component.tsx') {
      // Generate individual component files for each route
      if (moduleConfig.routes) {
        for (const route of moduleConfig.routes) {
          const componentName = context.kebabCase(route.componentName);
          const outputPath = join(outputDir, 'src', `${componentName}.component.tsx`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentRoute: route },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/page.scss') {
      // Generate individual SCSS files for each route
      if (moduleConfig.routes) {
        for (const route of moduleConfig.routes) {
          const componentName = context.kebabCase(route.componentName);
          const outputPath = join(outputDir, 'src', `${componentName}.scss`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentRoute: route },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/extension.component.tsx') {
      // Generate individual component files for each extension
      if (moduleConfig.extensions) {
        for (const extension of moduleConfig.extensions) {
          const componentName = context.kebabCase(extension.componentName);
          const outputPath = join(outputDir, 'src', `${componentName}.component.tsx`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentExtension: extension },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/extension.scss') {
      // Generate individual SCSS files for each extension
      if (moduleConfig.extensions) {
        for (const extension of moduleConfig.extensions) {
          const componentName = context.kebabCase(extension.componentName);
          const outputPath = join(outputDir, 'src', `${componentName}.scss`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentExtension: extension },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/modal.component.tsx') {
      // Generate individual component files for each modal (O3 convention: .modal.tsx)
      if (moduleConfig.modals) {
        for (const modal of moduleConfig.modals) {
          const fileBaseName = componentFileBaseName(modal.componentName, 'Modal');
          const outputPath = join(outputDir, 'src', `${fileBaseName}.modal.tsx`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentModal: { ...modal, fileBaseName } },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/modal.scss') {
      // Generate individual SCSS files for each modal
      if (moduleConfig.modals) {
        for (const modal of moduleConfig.modals) {
          const fileBaseName = componentFileBaseName(modal.componentName, 'Modal');
          const outputPath = join(outputDir, 'src', `${fileBaseName}.scss`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentModal: { ...modal, fileBaseName } },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/workspace.component.tsx') {
      // Generate individual component files for each workspace (O3 convention: .workspace.tsx)
      if (moduleConfig.workspaces) {
        for (const workspace of moduleConfig.workspaces) {
          const fileBaseName = componentFileBaseName(workspace.componentName, 'Workspace');
          const outputPath = join(outputDir, 'src', `${fileBaseName}.workspace.tsx`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentWorkspace: { ...workspace, fileBaseName } },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    if (templateFile === 'src/workspace.scss') {
      // Generate individual SCSS files for each workspace
      if (moduleConfig.workspaces) {
        for (const workspace of moduleConfig.workspaces) {
          const fileBaseName = componentFileBaseName(workspace.componentName, 'Workspace');
          const outputPath = join(outputDir, 'src', `${fileBaseName}.scss`);
          renderComponentFile(
            templatePath,
            outputPath,
            { ...context, currentWorkspace: { ...workspace, fileBaseName } },
            options.dryRun || false
          );
          fileCount++;
        }
      }
      continue;
    }

    // Regular file rendering
    // If the file has .hbs extension, strip it for the output
    let outputFile = templateFile;
    if (templateFile.endsWith('.hbs')) {
      outputFile = templateFile.slice(0, -4); // Remove .hbs extension
    }
    const outputPath = join(outputDir, outputFile);
    renderFile(templatePath, outputPath, context, options.dryRun || false);
    fileCount++;
  }

  return fileCount;
}
