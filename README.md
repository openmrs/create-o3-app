# create-o3-app

> A CLI tool to scaffold OpenMRS 3 frontend modules with best practices built-in

[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-yellow.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)

`create-o3-app` is a command-line tool that helps you quickly scaffold new
OpenMRS 3 frontend modules with all the necessary configuration, structure, and
best practices already set up. It generates a complete, production-ready module
structure that follows O3 conventions.

## Features

- 🚀 **Quick Setup** - Generate a complete O3 module in seconds
- 📦 **Self-Contained** - Templates are embedded, works offline
- 🎯 **O3 Compliant** - Follows OpenMRS 3 module structure and conventions
- 🔧 **Flexible** - Supports standalone modules, monorepos, and new monorepos
- 🛠️ **Build Tool Choice** - Choose between webpack or rspack
- 📝 **TypeScript Ready** - Full TypeScript support with proper types
- ✅ **Testing Setup** - Jest configured out of the box
- 🌐 **i18n Support** - Internationalization setup included
- 🎨 **Code Quality** - ESLint, Prettier, and Husky pre-configured
- 🔍 **Dry Run Mode** - Preview changes before generating files

## Installation

### Global installation (Recommended)

```bash
npm install -g create-o3-app
# or
yarn global add create-o3-app
# or
pnpm add -g create-o3-app
```

### Using npx (No installation required)

```bash
npx create-o3-app my-module-name
```

## Quick start

### Interactive mode

Simply run the command with your project name:

```bash
create-o3-app my-module-name
```

The CLI will guide you through a series of prompts to configure your module.

### Non-interactive mode

For CI/CD or automated setups, use flags to skip prompts:

```bash
create-o3-app my-module-name \
  --standalone \
  --package-name "@openmrs/esm-my-module" \
  --rspack \
  --route "/my-route" \
  --route-component "MyComponent" \
  --no-git \
  --quiet
```

## Usage examples

### Create a standalone module

```bash
create-o3-app patient-list --standalone
```

### Create a module in existing monorepo

```bash
create-o3-app patient-list --monorepo
```

The CLI automatically detects if you're in a monorepo. Use `--monorepo` to
explicitly create the module in the existing monorepo structure.

### Create a new monorepo

```bash
create-o3-app my-monorepo --new-monorepo
```

This creates a new monorepo root directory with a `package.json` configured
with workspaces, and places the module as the first package in the monorepo.

### Preview changes (Dry run)

```bash
create-o3-app my-module --dry-run
```

This will show you all files that would be created without actually creating them.

## Package manager

Generated O3 projects **always use yarn** (yarn 3+) as this is the OpenMRS 3 standard. The CLI will:

- Always use yarn for all generated O3 modules
- Use yarn for new standalone projects
- Use yarn when adding modules to existing monorepos (O3 standard)
- Install dependencies automatically unless you use `--dry-run`

## Command-line options

### Project options

| Option                  | Description                   | Default          |
| ----------------------- | ----------------------------- | ---------------- |
| `--package-name <name>` | NPM package name              | `@openmrs/esm-*` |
| `--rspack`              | Use rspack instead of webpack | `webpack`        |

### Project type options

| Option           | Description                        |
| ---------------- | ---------------------------------- |
| `--standalone`   | Create standalone module (default) |
| `--monorepo`     | Create module in existing monorepo |
| `--new-monorepo` | Create new monorepo root           |

### Module configuration

| Option                     | Description                       |
| -------------------------- | --------------------------------- |
| `--route <route>`          | Route path for page-based modules |
| `--route-component <name>` | Component name for the route      |

**Note:** `--route` and `--route-component` work together to create page-based
modules. Route paths can optionally start with `/` but must not end with `/`.
Example: `--route "/patients" --route-component "PatientList"`.

### Feature flags

| Option     | Description             | Default |
| ---------- | ----------------------- | ------- |
| `--no-git` | Skip git initialization | `false` |
| `--no-ci`  | Skip CI workflow        | `false` |

### Output options

| Option      | Description                       |
| ----------- | --------------------------------- |
| `--dry-run` | Preview changes without executing |
| `--verbose` | Verbose output                    |
| `--quiet`   | Suppress output (use defaults)    |

### Help

```bash
create-o3-app --help
create-o3-app --version
```

## Generated project structure

The CLI generates a complete O3 module structure:

```text
my-module/
├── src/
│   ├── index.ts              # Module entry point
│   ├── routes.json           # Route and extension definitions
│   ├── config-schema.ts      # Configuration schema
│   ├── root.component.tsx    # Root component
│   ├── root.scss             # Styles
│   ├── constants.ts          # Module constants
│   └── declarations.d.ts     # TypeScript declarations
├── translations/             # i18n translation files
│   └── en.json
├── tools/                    # Build and dev tools
│   ├── i18next-parser.config.js
│   └── setup-tests.ts
├── __mocks__/                # Jest mocks
├── package.json              # Package configuration
├── tsconfig.json             # TypeScript configuration
├── jest.config.js            # Jest configuration
├── webpack.config.js         # Webpack configuration (or rspack.config.js)
├── .eslintrc                 # ESLint configuration
├── prettier.config.js        # Prettier configuration
├── .gitignore                # Git ignore rules
├── .editorconfig             # Editor configuration
├── LICENSE                   # MPL-2.0 license
└── README.md                 # Project README
```

## What gets generated

### Core files

- **`src/index.ts`** - Module entry point with lifecycle exports
- **`src/routes.json`** - Defines pages, extensions, modals, workspaces, and
  feature flags
- **`src/config-schema.ts`** - Configuration schema using O3 framework types
- **`src/root.component.tsx`** - Root React component with routing setup

### Configuration files

- **`package.json`** - Complete package configuration with O3 dependencies
- **`tsconfig.json`** - TypeScript configuration with path aliases
- **`jest.config.js`** - Jest test configuration
- **`webpack.config.js`** or **`rspack.config.js`** - Build tool configuration
- **`.eslintrc`** - ESLint rules for TypeScript and React
- **`prettier.config.js`** - Code formatting rules

### Development tools

- **i18n** - Translation extraction and management
- **Testing** - Jest for unit tests with React Testing Library
- **Git Hooks** - Husky pre-commit and pre-push hooks
- **Code Quality** - ESLint, Prettier, lint-staged

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/openmrs/create-o3-app.git
cd create-o3-app

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Development commands

```bash
# Run in development mode (with watch)
npm run dev

# Build the CLI
npm run build

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run typecheck
```

### Git hooks

This project uses [Husky](https://typicode.github.io/husky/) and
[lint-staged](https://github.com/okonet/lint-staged) to enforce code quality:

- **Pre-commit hook**: Automatically formats and lints staged files, then runs
  type checking. This ensures code quality before commits.
- **Pre-push hook**: Runs the full test suite and build check before pushing to
  prevent broken code from being pushed.

Hooks are automatically installed when you run `npm install` (via the `prepare`
script). To bypass hooks in an emergency, use `git commit --no-verify` or `git
push --no-verify` (use sparingly).

### Testing the CLI locally

You can test the CLI locally using:

```bash
# Build first
npm run build

# Test with dry-run
node dist/index.js test-module --dry-run --standalone

# Or link globally
npm link
create-o3-app test-module --dry-run
```

## How it works

1. **Template System** - Uses embedded Handlebars templates (no external dependencies)
2. **Validation** - Validates inputs using Zod schemas
3. **Monorepo Detection** - Automatically detects if you're in a monorepo
4. **File Generation** - Generates files with proper templating and variable substitution
5. **Git Integration** - Optionally initializes git and sets up remote
6. **Package Manager** - Always uses yarn (yarn 3+) for O3 projects, as per O3 standards

## Contributing

We welcome contributions! Please open an issue or submit a pull request.

### Reporting issues

If you encounter any issues or have suggestions, please [open an issue](https://github.com/openmrs/create-o3-app/issues).

## Related resources

- [OpenMRS 3 Documentation](https://o3-docs.openmrs.org/)
- [O3 Module Structure](https://o3-docs.openmrs.org/docs/module-structure)
- [O3 Coding Conventions](https://o3-docs.openmrs.org/docs/coding-conventions)
- [OpenMRS Community](https://openmrs.org/)

## License

This project is licensed under the Mozilla Public License 2.0 (MPL-2.0). See
the [LICENSE](LICENSE) file for details.

---

**Note**: This CLI generates modules that follow OpenMRS 3 conventions. For
questions about O3 development, please refer to the
[O3 documentation](https://o3-docs.openmrs.org/).
