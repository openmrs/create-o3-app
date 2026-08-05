# Contributing to {{packageName}}

Thank you for your interest in contributing! This document outlines how to get set up and how to submit changes.

## Getting started

1. Fork and clone the repository
2. Install dependencies:

   ```bash
   yarn install
   ```

3. Start the development server:

   ```bash
   yarn start
   ```

## Development workflow

1. Create a branch for your change:

   ```bash
   git checkout -b feat/my-change
   ```

2. Make your changes, adding or updating tests where appropriate.
3. Verify your changes before opening a pull request:

   ```bash
   yarn lint
   yarn typescript
   yarn test
   ```

## Commit messages

Please use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages and pull request titles, e.g. `feat: add patient banner extension` or `fix: correct date formatting in the summary tile`.

## Translations

If your change adds or updates user-facing strings, run:

```bash
yarn extract-translations
```

and commit the updated translation files.

## Submitting a pull request

1. Push your branch to your fork and open a pull request.
2. Describe what the change does and why it is needed.
3. Include screenshots or recordings for UI changes.

## Getting help

- [OpenMRS Talk](https://talk.openmrs.org/) - Community forum for questions
- [O3 Documentation](https://o3-docs.openmrs.org/) - Frontend development guides
