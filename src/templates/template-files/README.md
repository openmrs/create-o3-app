# {{packageName}}

{{description}}

## Quick start

\`\`\`bash
yarn install
yarn start
\`\`\`

## What's included

- ✅ OpenMRS 3.0 microfrontend setup
- ✅ Carbon Design System integration
- ✅ Internationalization (i18n) ready
- ✅ TypeScript configuration
- ✅ Jest testing setup
- ✅ ESLint + Prettier

## Learn more

### OpenMRS O3 resources

- [Getting Started](https://o3-docs.openmrs.org/docs/getting-started) - Start here for O3 development
- [Creating a Frontend Module](https://o3-docs.openmrs.org/docs/frontend-modules/creating-a-frontend-module) - Step-by-step guide
- [Framework Concepts](https://o3-docs.openmrs.org/docs/framework-concepts) - Core O3 patterns

### Development guide

- [Extension System](https://o3-docs.openmrs.org/docs/extension-system) - Adding widgets and extensions
- [State Management](https://o3-docs.openmrs.org/docs/state-management) - Managing app state
- [Carbon and Styling](https://o3-docs.openmrs.org/docs/carbon-and-styling) - UI components and styling
- [Testing](https://o3-docs.openmrs.org/docs/testing) - Testing your module

### Community

- [OpenMRS Talk](https://talk.openmrs.org/) - Community forum for questions
- [OpenMRS Wiki](https://wiki.openmrs.org/display/RES/OpenMRS+3.x+Dev+Forum) - Join the developer community

## Common tasks

{{#if routes}}
### Adding new routes

See the [Routing Guide](https://o3-docs.openmrs.org/docs/frontend-modules/routing) for details.
{{/if}}

{{#if extensions}}
### Adding extensions

Learn about the [Extension System](https://o3-docs.openmrs.org/docs/extension-system).
{{/if}}

### Development commands

\`\`\`bash
# Start development server
yarn start

# Build for production
yarn build

# Run tests
yarn test

# Watch tests
yarn test:watch

# Extract translations
yarn extract-translations

# Type checking
yarn typescript

# Linting
yarn lint

# Format code
yarn prettier
\`\`\`

## Installation

\`\`\`bash
yarn add {{packageName}}
\`\`\`

## Usage

[Add usage instructions here]

## Building

\`\`\`bash
yarn build
\`\`\`

## Testing

\`\`\`bash
yarn test
\`\`\`
