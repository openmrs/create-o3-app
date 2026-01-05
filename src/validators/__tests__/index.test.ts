import { describe, it, expect } from 'vitest';
import {
  validateProjectName,
  validatePackageName,
  validateDescription,
  validateBuildTool,
  validateTemplateVersion,
  validateRoutePath,
  validateComponentName,
} from '../index.js';

describe('Validators', () => {
  describe('validateProjectName', () => {
    it('should return success for valid names', () => {
      const result = validateProjectName('my-module');
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid names', () => {
      const result = validateProjectName('MyModule');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validatePackageName', () => {
    it('should return success for valid package names', () => {
      const result = validatePackageName('@openmrs/esm-my-module');
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for invalid package names', () => {
      const result = validatePackageName('');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateDescription', () => {
    it('should return success for valid descriptions', () => {
      const result = validateDescription('My module description');
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return errors for empty descriptions', () => {
      const result = validateDescription('');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateBuildTool', () => {
    it('should return success for valid build tools', () => {
      expect(validateBuildTool('webpack').success).toBe(true);
      expect(validateBuildTool('rspack').success).toBe(true);
    });

    it('should return errors for invalid build tools', () => {
      const result = validateBuildTool('vite');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateTemplateVersion', () => {
    it('should return success for valid versions', () => {
      expect(validateTemplateVersion('latest').success).toBe(true);
      expect(validateTemplateVersion('next').success).toBe(true);
      expect(validateTemplateVersion('1.0.0').success).toBe(true);
    });

    it('should return errors for invalid versions', () => {
      const result = validateTemplateVersion('');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRoutePath', () => {
    it('should return success for valid route paths', () => {
      expect(validateRoutePath('patient-list').success).toBe(true);
      expect(validateRoutePath('patient/list').success).toBe(true);
      expect(validateRoutePath('/patient-list').success).toBe(true);
    });

    it('should return errors for invalid route paths', () => {
      expect(validateRoutePath('PatientList').success).toBe(false);
    });
  });

  describe('validateComponentName', () => {
    it('should return success for valid component names', () => {
      expect(validateComponentName('PatientList').success).toBe(true);
      expect(validateComponentName('MyComponent').success).toBe(true);
    });

    it('should return errors for invalid component names', () => {
      expect(validateComponentName('patient-list').success).toBe(false);
      expect(validateComponentName('patientList').success).toBe(false);
    });
  });
});
