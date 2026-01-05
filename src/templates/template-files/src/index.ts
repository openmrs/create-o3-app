import { getAsyncLifecycle, getSyncLifecycle, defineConfigSchema } from '@openmrs/esm-framework';
import { configSchema } from './config-schema';
import { moduleName } from './constants';

const options = {
  featureName: '{{kebabCase projectName}}',
  moduleName,
};

export const importTranslation = require.context('../translations', false, /.json$/, 'lazy');

export function startupApp() {
  defineConfigSchema(moduleName, configSchema);
}

// Backend dependencies
{{#if backendDependencies}}
export const backendDependencies = {
{{#each backendDependencies}}
  '{{this}}': '{{@index}}',
{{/each}}
};
{{else}}
export const backendDependencies = {};
{{/if}}

// Root component
export const root = getAsyncLifecycle(() => import('./root.component'), options);

// Extensions
{{#if extensions}}
{{#each extensions}}
export const {{kebabCase this.name}} = getSyncLifecycle(
  () => import('./{{kebabCase this.name}}.component'),
  options
);
{{/each}}
{{/if}}

// Modals
{{#if modals}}
{{#each modals}}
export const {{kebabCase this.name}} = getAsyncLifecycle(
  () => import('./{{kebabCase this.name}}.component'),
  options
);
{{/each}}
{{/if}}

// Workspaces
{{#if workspaces}}
{{#each workspaces}}
export const {{kebabCase this.name}} = getAsyncLifecycle(
  () => import('./{{kebabCase this.name}}.component'),
  options
);
{{/each}}
{{/if}}

