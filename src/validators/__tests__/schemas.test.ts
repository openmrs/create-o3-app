import { describe, it, expect } from 'vitest';
import {
  projectNameSchema,
  packageNameSchema,
  descriptionSchema,
  buildToolSchema,
  templateVersionSchema,
  routePathSchema,
  componentNameSchema,
  extensionNameSchema,
  slotNameSchema,
  backendDependencySchema,
} from '../schemas.js';

describe('Validation Schemas', () => {
  describe('projectNameSchema', () => {
    it('should accept valid project names', () => {
      expect(() => projectNameSchema.parse('my-module')).not.toThrow();
      expect(() => projectNameSchema.parse('patient-list')).not.toThrow();
      expect(() => projectNameSchema.parse('module123')).not.toThrow();
    });

    it('should reject invalid project names', () => {
      expect(() => projectNameSchema.parse('MyModule')).toThrow();
      expect(() => projectNameSchema.parse('my_module')).toThrow();
      expect(() => projectNameSchema.parse('-my-module')).toThrow();
      expect(() => projectNameSchema.parse('my-module-')).toThrow();
      expect(() => projectNameSchema.parse('')).toThrow();
    });
  });

  describe('packageNameSchema', () => {
    it('should accept valid package names', () => {
      expect(() => packageNameSchema.parse('@openmrs/esm-my-module')).not.toThrow();
      expect(() => packageNameSchema.parse('my-package')).not.toThrow();
      expect(() => packageNameSchema.parse('@scope/package')).not.toThrow();
    });

    it('should reject invalid package names', () => {
      expect(() => packageNameSchema.parse('')).toThrow();
      expect(() => packageNameSchema.parse('Invalid Package')).toThrow();
    });
  });

  describe('descriptionSchema', () => {
    it('should accept valid descriptions', () => {
      expect(() => descriptionSchema.parse('My module description')).not.toThrow();
      expect(() => descriptionSchema.parse('A')).not.toThrow();
    });

    it('should reject invalid descriptions', () => {
      expect(() => descriptionSchema.parse('')).toThrow();
      expect(() => descriptionSchema.parse('a'.repeat(501))).toThrow();
    });
  });

  describe('buildToolSchema', () => {
    it('should accept valid build tools', () => {
      expect(() => buildToolSchema.parse('webpack')).not.toThrow();
      expect(() => buildToolSchema.parse('rspack')).not.toThrow();
    });

    it('should reject invalid build tools', () => {
      expect(() => buildToolSchema.parse('vite')).toThrow();
      expect(() => buildToolSchema.parse('rollup')).toThrow();
    });
  });

  describe('templateVersionSchema', () => {
    it('should accept valid template versions', () => {
      expect(() => templateVersionSchema.parse('latest')).not.toThrow();
      expect(() => templateVersionSchema.parse('next')).not.toThrow();
      expect(() => templateVersionSchema.parse('1.0.0')).not.toThrow();
      expect(() => templateVersionSchema.parse('v1.0.0')).not.toThrow();
    });

    it('should reject invalid template versions', () => {
      expect(() => templateVersionSchema.parse('')).toThrow();
    });
  });

  describe('routePathSchema', () => {
    it('should accept valid route paths', () => {
      expect(() => routePathSchema.parse('patient-list')).not.toThrow();
      expect(() => routePathSchema.parse('patient/list')).not.toThrow();
      expect(() => routePathSchema.parse('patient-list-123')).not.toThrow();
      expect(() => routePathSchema.parse('/patient-list')).not.toThrow();
    });

    it('should reject invalid route paths', () => {
      expect(() => routePathSchema.parse('patient-list/')).toThrow();
      expect(() => routePathSchema.parse('PatientList')).toThrow();
      expect(() => routePathSchema.parse('')).toThrow();
    });
  });

  describe('componentNameSchema', () => {
    it('should accept valid component names', () => {
      expect(() => componentNameSchema.parse('PatientList')).not.toThrow();
      expect(() => componentNameSchema.parse('MyComponent')).not.toThrow();
      expect(() => componentNameSchema.parse('Component123')).not.toThrow();
    });

    it('should reject invalid component names', () => {
      expect(() => componentNameSchema.parse('patient-list')).toThrow();
      expect(() => componentNameSchema.parse('patientList')).toThrow();
      expect(() => componentNameSchema.parse('')).toThrow();
    });
  });

  describe('extensionNameSchema', () => {
    it('should accept valid extension names', () => {
      expect(() => extensionNameSchema.parse('my-extension')).not.toThrow();
      expect(() => extensionNameSchema.parse('extension-123')).not.toThrow();
    });

    it('should reject invalid extension names', () => {
      expect(() => extensionNameSchema.parse('MyExtension')).toThrow();
      expect(() => extensionNameSchema.parse('my_extension')).toThrow();
      expect(() => extensionNameSchema.parse('')).toThrow();
    });
  });

  describe('slotNameSchema', () => {
    it('should accept valid slot names', () => {
      expect(() => slotNameSchema.parse('my-slot')).not.toThrow();
      expect(() => slotNameSchema.parse('slot-123')).not.toThrow();
    });

    it('should reject invalid slot names', () => {
      expect(() => slotNameSchema.parse('MySlot')).toThrow();
      expect(() => slotNameSchema.parse('my_slot')).toThrow();
      expect(() => slotNameSchema.parse('')).toThrow();
    });
  });

  describe('backendDependencySchema', () => {
    it('should accept valid backend dependencies', () => {
      expect(() => backendDependencySchema.parse('webservices.rest>=2.24.0')).not.toThrow();
      expect(() => backendDependencySchema.parse('module@1.0.0')).not.toThrow();
    });

    it('should reject invalid backend dependencies', () => {
      expect(() => backendDependencySchema.parse('webservices.rest')).toThrow();
      expect(() => backendDependencySchema.parse('module>=')).toThrow();
      expect(() => backendDependencySchema.parse('')).toThrow();
    });
  });
});
