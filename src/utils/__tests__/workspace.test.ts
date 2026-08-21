import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdirSync, rmSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { monorepoRootError, updateWorkspaceConfig } from '../workspace.js';

const testDir = join(process.cwd(), 'test-workspace-utils');

describe('workspace utilities', () => {
  beforeEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    vi.restoreAllMocks();
  });

  const yamlPath = () => join(testDir, 'pnpm-workspace.yaml');

  describe('updateWorkspaceConfig with pnpm', () => {
    it('adds to an inline packages array without duplicating the key', async () => {
      // Line-based editing appended a second `packages:` here, which made the
      // file unparseable because YAML map keys must be unique
      writeFileSync(yamlPath(), 'packages: ["packages/*"]\n');

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      const parsed = parse(readFileSync(yamlPath(), 'utf-8'));
      expect(parsed.packages).toEqual(['packages/*', 'packages/apps/esm-thing']);
    });

    it('adds to a block packages list', async () => {
      writeFileSync(yamlPath(), 'packages:\n  - "packages/*"\n');

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      expect(parse(readFileSync(yamlPath(), 'utf-8')).packages).toEqual([
        'packages/*',
        'packages/apps/esm-thing',
      ]);
    });

    it('creates the packages key when the file has other settings', async () => {
      writeFileSync(yamlPath(), 'shamefullyHoist: true\n');

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      const parsed = parse(readFileSync(yamlPath(), 'utf-8'));
      expect(parsed.shamefullyHoist).toBe(true);
      expect(parsed.packages).toEqual(['packages/apps/esm-thing']);
    });

    it('preserves comments', async () => {
      writeFileSync(yamlPath(), '# keep me\npackages:\n  - "packages/*"\n');

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      expect(readFileSync(yamlPath(), 'utf-8')).toContain('# keep me');
    });

    it('is a no-op when the location is already listed', async () => {
      writeFileSync(yamlPath(), 'packages:\n  - "packages/apps/esm-thing"\n');
      const before = readFileSync(yamlPath(), 'utf-8');

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      expect(readFileSync(yamlPath(), 'utf-8')).toBe(before);
    });

    it('leaves an already-invalid file untouched', async () => {
      const broken = 'packages: ["a"]\npackages:\n  - "b"\n';
      writeFileSync(yamlPath(), broken);

      await updateWorkspaceConfig(testDir, 'packages/apps/esm-thing');

      // The updater warns rather than compounding the damage
      expect(readFileSync(yamlPath(), 'utf-8')).toBe(broken);
    });
  });

  describe('monorepoRootError', () => {
    it('accepts a yarn or npm root declaring workspaces', () => {
      writeFileSync(
        join(testDir, 'package.json'),
        JSON.stringify({ name: 'root', workspaces: ['packages/*'] })
      );
      expect(monorepoRootError(testDir)).toBeNull();
    });

    it('accepts a pnpm root', () => {
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'root' }));
      writeFileSync(yamlPath(), 'packages:\n  - "packages/*"\n');
      expect(monorepoRootError(testDir)).toBeNull();
    });

    it('rejects an ordinary project with no workspace declaration', () => {
      writeFileSync(join(testDir, 'package.json'), JSON.stringify({ name: 'ordinary' }));
      expect(monorepoRootError(testDir)).toMatch(/No workspace declaration found/);
    });

    it('rejects a directory with no package.json at all', () => {
      expect(monorepoRootError(testDir)).toMatch(/No workspace declaration found/);
    });
  });
});
