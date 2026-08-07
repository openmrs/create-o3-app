import { describe, it, expect } from 'vitest';
import {
  componentFileBaseName,
  deriveDefaultComponentName,
  reservedComponentNameError,
  derivedOutputFiles,
  OutputFileClaims,
  toKebabCase,
} from '../naming.js';
import { validateComponentName } from '../../validators/index.js';

describe('toKebabCase', () => {
  it('kebab-cases PascalCase component names', () => {
    expect(toKebabCase('DeleteThingModal')).toBe('delete-thing-modal');
    expect(toKebabCase('TestComponent')).toBe('test-component');
  });
});

describe('componentFileBaseName', () => {
  it('strips the trailing kind suffix', () => {
    expect(componentFileBaseName('DeleteThingModal', 'Modal')).toBe('delete-thing');
    expect(componentFileBaseName('ThingFormWorkspace', 'Workspace')).toBe('thing-form');
  });

  it('passes names without the suffix through unchanged', () => {
    expect(componentFileBaseName('ConfirmThing', 'Modal')).toBe('confirm-thing');
  });

  it('does not strip a name that is exactly the kind', () => {
    expect(componentFileBaseName('Modal', 'Modal')).toBe('modal');
    expect(componentFileBaseName('Workspace', 'Workspace')).toBe('workspace');
  });
});

describe('derivedOutputFiles', () => {
  it('derives the O3 file names per kind', () => {
    expect(derivedOutputFiles('page', 'TestComponent')).toEqual([
      'test-component.component.tsx',
      'test-component.scss',
    ]);
    expect(derivedOutputFiles('extension', 'TestBanner')).toEqual([
      'test-banner.component.tsx',
      'test-banner.scss',
    ]);
    expect(derivedOutputFiles('modal', 'DeleteThingModal')).toEqual([
      'delete-thing.modal.tsx',
      'delete-thing.scss',
    ]);
    expect(derivedOutputFiles('workspace', 'ThingFormWorkspace')).toEqual([
      'thing-form.workspace.tsx',
      'thing-form.scss',
    ]);
  });
});

describe('OutputFileClaims', () => {
  it('claims the static root component files upfront', () => {
    const claims = new OutputFileClaims();
    expect(claims.check('page', 'Root')).toMatch(
      /Page component "Root" and the app root component would both generate src\/root\.component\.tsx/
    );
    expect(claims.check('modal', 'RootModal')).toMatch(/would both generate src\/root\.scss/);
  });

  it('rejects two components deriving the same file across kinds', () => {
    const claims = new OutputFileClaims();
    expect(claims.claim('modal', 'DeleteThingModal')).toBeNull();
    expect(claims.claim('workspace', 'DeleteThingWorkspace')).toMatch(
      /Workspace component "DeleteThingWorkspace" and Modal component "DeleteThingModal" would both generate src\/delete-thing\.scss/
    );
  });

  it('flags a repeated component as configured more than once', () => {
    const claims = new OutputFileClaims();
    expect(claims.claim('extension', 'TestBanner')).toBeNull();
    expect(claims.claim('extension', 'TestBanner')).toMatch(
      /Extension component "TestBanner" is configured more than once/
    );
  });

  it('checks without claiming', () => {
    const claims = new OutputFileClaims();
    expect(claims.check('modal', 'DeleteThingModal')).toBeNull();
    expect(claims.check('modal', 'DeleteThingModal')).toBeNull();
    expect(claims.claim('modal', 'DeleteThingModal')).toBeNull();
  });

  it('claims nothing when any derived file collides', () => {
    const claims = new OutputFileClaims();
    expect(claims.claim('page', 'DeleteThing')).toBeNull();
    // The modal collides on the stylesheet, so its .modal.tsx must not be claimed either
    expect(claims.claim('modal', 'DeleteThingModal')).toMatch(/delete-thing\.scss/);
    expect(claims.claim('modal', 'DeleteThingModal')).toMatch(
      /Modal component "DeleteThingModal" and Page component "DeleteThing"/
    );
  });

  it('rejects one component name reused across exporting kinds', () => {
    // The files differ (delete-thing-modal.component.tsx vs delete-thing.modal.tsx),
    // but both kinds emit `export const deleteThingModal` in index.ts
    const claims = new OutputFileClaims();
    expect(claims.claim('extension', 'DeleteThingModal')).toBeNull();
    expect(claims.claim('modal', 'DeleteThingModal')).toMatch(
      /Modal component "DeleteThingModal" and Extension component "DeleteThingModal" would both export `deleteThingModal` from src\/index\.ts/
    );
    // The failed claim recorded nothing: the same modal still fails on the export,
    // not as "configured more than once"
    expect(claims.claim('modal', 'DeleteThingModal')).toMatch(/would both export/);
  });

  it('does not export-claim pages', () => {
    const claims = new OutputFileClaims();
    expect(claims.claim('page', 'DeleteThingModal')).toBeNull();
    // The page derives delete-thing-modal.component.tsx and the modal derives
    // delete-thing.modal.tsx, and pages have no lifecycle export, so this
    // combination is legal even though the component names match
    expect(claims.claim('modal', 'DeleteThingModal')).toBeNull();
  });
});

describe('reservedComponentNameError', () => {
  it('rejects identifiers the component templates import', () => {
    for (const name of ['React', 'Layer', 'Tile', 'Button', 'ModalHeader', 'Route', 'Root']) {
      expect(reservedComponentNameError(name)).toMatch(/already imported/);
    }
  });

  it('rejects names whose lifecycle export index.ts already declares', () => {
    expect(reservedComponentNameError('Options')).toMatch(/would export `options`/);
    expect(reservedComponentNameError('ModuleName')).toMatch(/would export `moduleName`/);
    expect(reservedComponentNameError('ConfigSchema')).toMatch(/would export `configSchema`/);
  });

  it('accepts ordinary component names', () => {
    for (const name of ['PatientSummary', 'DeleteThingModal', 'ThingFormWorkspace', 'Buttons']) {
      expect(reservedComponentNameError(name)).toBeNull();
    }
  });
});

describe('deriveDefaultComponentName', () => {
  it('derives PascalCase from the project name', () => {
    expect(deriveDefaultComponentName('patient-summary')).toBe('PatientSummary');
    expect(deriveDefaultComponentName('billing')).toBe('Billing');
  });

  it('drops leading digits, since a component name must be an identifier', () => {
    expect(deriveDefaultComponentName('123-app')).toBe('App');
    expect(deriveDefaultComponentName('2fa-setup')).toBe('FaSetup');
  });

  it('falls back when the project name has no letters', () => {
    expect(deriveDefaultComponentName('123')).toBe('App');
  });

  it('suffixes names that would collide with imported identifiers', () => {
    expect(deriveDefaultComponentName('react')).toBe('ReactPage');
    expect(deriveDefaultComponentName('route')).toBe('RoutePage');
  });

  it('never derives a name the CLI would reject', () => {
    for (const project of [
      'react',
      'route',
      'root',
      'button',
      'options',
      '123-app',
      '123',
      '2fa-setup',
      'a',
      'my-1st-app',
    ]) {
      const derived = deriveDefaultComponentName(project);
      // Must be a valid PascalCase identifier and not collide with imports
      expect(validateComponentName(derived).success).toBe(true);
      expect(reservedComponentNameError(derived)).toBeNull();
    }
  });
});
