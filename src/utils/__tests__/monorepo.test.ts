import { describe, it, expect, beforeEach, vi } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { detectMonorepo } from '../monorepo.js';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('Monorepo Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect pnpm workspace', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('pnpm-workspace.yaml');
    });

    const result = detectMonorepo('/test');
    expect(result.isMonorepo).toBe(true);
    expect(result.type).toBe('pnpm');
  });

  it('should detect yarn workspace', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('package.json') || path.includes('.yarnrc.yml');
    });

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ workspaces: ['packages/*'] }));

    const result = detectMonorepo('/test');
    expect(result.isMonorepo).toBe(true);
    expect(result.type).toBe('yarn');
  });

  it('should detect npm workspace', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('package.json');
    });

    vi.mocked(readFileSync).mockReturnValue(JSON.stringify({ workspaces: ['packages/*'] }));

    const result = detectMonorepo('/test');
    expect(result.isMonorepo).toBe(true);
    expect(result.type).toBe('npm');
  });

  it('should return false for non-monorepo', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const result = detectMonorepo('/test');
    expect(result.isMonorepo).toBe(false);
  });
});
