export type ComponentKind = 'page' | 'extension' | 'modal' | 'workspace';

const KIND_LABELS: Record<ComponentKind, string> = {
  page: 'Page',
  extension: 'Extension',
  modal: 'Modal',
  workspace: 'Workspace',
};

export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * The lifecycle export identifier a component gets in the generated
 * src/index.ts. Mirrors the camelCase Handlebars helper the template uses.
 */
export function lifecycleExportName(componentName: string): string {
  return componentName
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())
    .replace(/^[A-Z]/, (letter) => letter.toLowerCase());
}

/**
 * Derive the generated file basename for a modal or workspace component: the
 * kebab-cased component name with any trailing kind suffix stripped, since the
 * O3 file suffix (.modal.tsx / .workspace.tsx) already encodes the kind.
 */
export function componentFileBaseName(componentName: string, kind: 'Modal' | 'Workspace'): string {
  const stripped =
    componentName.length > kind.length && componentName.endsWith(kind)
      ? componentName.slice(0, -kind.length)
      : componentName;
  return toKebabCase(stripped);
}

/**
 * PascalCase identifiers the generated components already bring into scope. A
 * component with one of these names produces a duplicate declaration: a page
 * named `React` renders `const React: React.FC` beside
 * `import React from 'react'`, which fails to compile.
 */
const RESERVED_COMPONENT_NAMES = new Set([
  // Every component template
  'React',
  // page.component.tsx
  'Layer',
  'Tile',
  // extension / modal / workspace templates
  'Button',
  'ButtonSet',
  'ModalBody',
  'ModalFooter',
  'ModalHeader',
  'Workspace2',
  'Workspace2DefinitionProps',
  // root.component.tsx, which imports every page component
  'BrowserRouter',
  'Routes',
  'Route',
  'Root',
]);

/**
 * Identifiers src/index.ts declares. A component name whose lifecycle export
 * (its camelCase form) matches one of these redeclares it.
 */
const RESERVED_EXPORT_NAMES = new Set([
  'getAsyncLifecycle',
  'defineConfigSchema',
  'configSchema',
  'moduleName',
  'options',
  'importTranslation',
  'startupApp',
  'root',
]);

/**
 * Returns an error message if a component name would collide with an
 * identifier the generated files already declare or import.
 */
export function reservedComponentNameError(componentName: string): string | null {
  if (RESERVED_COMPONENT_NAMES.has(componentName)) {
    return `"${componentName}" is already imported by the generated components, so the generated module would not compile. Choose a different component name.`;
  }
  const exportName = lifecycleExportName(componentName);
  if (RESERVED_EXPORT_NAMES.has(exportName)) {
    return `"${componentName}" would export \`${exportName}\` from src/index.ts, which already declares it. Choose a different component name.`;
  }
  return null;
}

/**
 * Derive the default page component name from the project name. Project names
 * allow leading digits and words that collide with imported identifiers, so
 * the derived name is sanitized into a usable identifier: `123-app` becomes
 * `App` and `react` becomes `ReactPage`.
 */
export function deriveDefaultComponentName(projectName: string): string {
  const pascal = projectName
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  // A component name must be a PascalCase identifier: drop leading digits, and
  // recapitalize afterwards, since stripping them can expose a lowercase letter
  const identifier = pascal.replace(/^[^A-Za-z]+/, '');
  const base =
    identifier.length > 0 ? identifier.charAt(0).toUpperCase() + identifier.slice(1) : 'App';
  return reservedComponentNameError(base) ? `${base}Page` : base;
}

/**
 * The src/ files a component of the given kind generates.
 */
export function derivedOutputFiles(kind: ComponentKind, componentName: string): string[] {
  switch (kind) {
    case 'page':
    case 'extension': {
      const base = toKebabCase(componentName);
      return [`${base}.component.tsx`, `${base}.scss`];
    }
    case 'modal': {
      const base = componentFileBaseName(componentName, 'Modal');
      return [`${base}.modal.tsx`, `${base}.scss`];
    }
    case 'workspace': {
      const base = componentFileBaseName(componentName, 'Workspace');
      return [`${base}.workspace.tsx`, `${base}.scss`];
    }
  }
}

/**
 * Tracks the generated output files and index.ts lifecycle exports that are
 * already claimed so that two components cannot silently overwrite each
 * other. Component names are distinct inputs, but the derived basenames can
 * collide: `DeleteThing` and `DeleteThingModal` both map to
 * delete-thing.modal.tsx, and a modal and workspace with matching basenames
 * both emit the same stylesheet. Extensions, modals, and workspaces also
 * each emit `export const <camelCase name>` in index.ts, so one component
 * name used across those kinds redeclares the export even when the files
 * differ. Reusing one component across entries is not safe either: repeated
 * routes emit duplicate imports in root.component.tsx, repeated lifecycle
 * exports break index.ts, and modal and workspace files interpolate
 * entry-specific text.
 */
export class OutputFileClaims {
  private readonly owners = new Map<string, string>();
  private readonly exportOwners = new Map<string, string>();

  constructor() {
    // The static root component files and its lifecycle export are always generated
    this.owners.set('root.component.tsx', 'the app root component');
    this.owners.set('root.scss', 'the app root component');
    this.exportOwners.set('root', 'the app root component');
  }

  /**
   * Returns a collision error message if any file or index.ts export the
   * component would generate is already claimed, without claiming anything.
   */
  check(kind: ComponentKind, componentName: string): string | null {
    const owner = `${KIND_LABELS[kind]} component "${componentName}"`;
    for (const file of derivedOutputFiles(kind, componentName)) {
      const existing = this.owners.get(file);
      if (existing) {
        const detail =
          existing === owner
            ? `${owner} is configured more than once`
            : `${owner} and ${existing} would both generate src/${file}`;
        return `${detail}. Give each component a unique name so the generated files do not overwrite each other.`;
      }
    }
    // Pages have no per-component lifecycle export; only root is exported
    if (kind !== 'page') {
      const exportName = lifecycleExportName(componentName);
      const existing = this.exportOwners.get(exportName);
      if (existing) {
        const detail =
          existing === owner
            ? `${owner} is configured more than once`
            : `${owner} and ${existing} would both export \`${exportName}\` from src/index.ts`;
        return `${detail}. Give each component a unique name so the generated module compiles.`;
      }
    }
    return null;
  }

  /**
   * Claims the files and index.ts export the component generates. Returns a
   * collision error message and claims nothing if any of them is already
   * taken.
   */
  claim(kind: ComponentKind, componentName: string): string | null {
    const error = this.check(kind, componentName);
    if (error) {
      return error;
    }
    const owner = `${KIND_LABELS[kind]} component "${componentName}"`;
    for (const file of derivedOutputFiles(kind, componentName)) {
      this.owners.set(file, owner);
    }
    if (kind !== 'page') {
      this.exportOwners.set(lifecycleExportName(componentName), owner);
    }
    return null;
  }
}
