import { Command } from 'commander';
import { createCommand } from './commands/create.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get version from package.json
// Resolve path relative to the current file location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple possible locations for package.json
let packageJsonPath = join(__dirname, '../../package.json');
if (!existsSync(packageJsonPath)) {
  packageJsonPath = join(__dirname, '../package.json');
}
if (!existsSync(packageJsonPath)) {
  // Fallback: try from process.cwd()
  packageJsonPath = join(process.cwd(), 'package.json');
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

const program = new Command();

program
  .name('create-o3-app')
  .description('CLI tool to scaffold OpenMRS 3 frontend modules')
  .version(packageJson.version);

// Create command
program
  .argument('[project-name]', 'Name of the project/directory to create')
  .option('--package-name <name>', 'NPM package name (overrides default package name)')
  .option('--rspack', 'Deprecated; rspack is now the default build tool')
  .option('--webpack', 'Use webpack instead of rspack as build tool')
  .option('--standalone', 'Create standalone module (not in monorepo)')
  .option('--monorepo', 'Create module in existing monorepo (detects monorepo automatically)')
  .option('--new-monorepo', 'Create new monorepo root with this module as first package')
  .option('--route <route>', 'Route path for page-based modules (e.g., "/patients")')
  .option('--route-component <name>', 'Component name for the route (use with --route)')
  .option('--no-git', 'Skip git initialization')
  .option('--no-ci', 'Skip CI workflow generation')
  .option('--dry-run', 'Preview changes without executing')
  .option('--verbose', 'Verbose output')
  .option('--quiet', 'Suppress output')
  .addHelpText(
    'after',
    `
Examples:
  $ create-o3-app my-module --standalone
  $ create-o3-app my-module --monorepo --route "/patients"
  $ create-o3-app my-module --dry-run
  $ create-o3-app my-module --package-name "@openmrs/esm-my-module" --webpack
  $ create-o3-app my-module --new-monorepo --route "/patients" --route-component "PatientList"

For more information, visit: https://github.com/openmrs/create-o3-app
  `
  )
  .action(createCommand);

// Parse arguments
program.parse();
