export interface CreateOptions {
  packageName?: string;
  rspack?: boolean;
  standalone?: boolean;
  monorepo?: boolean;
  newMonorepo?: boolean;
  route?: string;
  routeComponent?: string;
  git?: boolean;
  ci?: boolean;
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
}

export interface ProjectConfig {
  projectName: string;
  packageName: string;
  description: string;
  buildTool: 'webpack' | 'rspack';
  isMonorepo: boolean;
  isNewMonorepo: boolean;
  packageLocation?: string;
  git: boolean;
  ci: boolean;
}

export interface ModuleConfig {
  type: 'page' | 'extension' | 'both' | 'modal';
  routes?: RouteConfig[];
  extensions?: ExtensionConfig[];
  modals?: ModalConfig[];
  workspaces?: WorkspaceConfig[];
  featureFlags?: FeatureFlagConfig[];
  backendDependencies?: string[];
  offline?: boolean;
  errorBoundary?: boolean;
  pathAliases?: string[];
  coverageThresholds?: boolean;
  accessibility?: boolean;
  dependabot?: boolean;
  contributing?: boolean;
  turbo?: boolean;
}

export interface RouteConfig {
  path: string;
  componentName: string;
  online?: boolean;
  offline?: boolean;
}

export interface ExtensionConfig {
  name: string;
  slot: string;
  componentName: string;
  order?: number;
  online?: boolean;
  offline?: boolean;
  featureFlag?: string;
}

export interface ModalConfig {
  name: string;
  componentName: string;
}

export interface WorkspaceConfig {
  name: string;
  title: string;
  componentName: string;
  type: 'form' | 'chart' | 'other';
}

export interface FeatureFlagConfig {
  name: string;
  label: string;
  description: string;
}

export interface MonorepoContext {
  isMonorepo: boolean;
  type?: 'yarn' | 'pnpm' | 'npm';
  rootPath?: string;
  workspacePattern?: string;
}
