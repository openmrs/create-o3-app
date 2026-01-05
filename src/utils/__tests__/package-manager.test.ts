import { describe, it, expect, beforeEach, vi } from 'vitest';
import { existsSync } from 'fs';
import { detectPackageManager } from '../package-manager.js';

// Mock fs module
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

describe('Package Manager Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect pnpm from lock file', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('pnpm-lock.yaml');
    });

    const pm = detectPackageManager('/test');
    expect(pm).toBe('pnpm');
  });

  it('should detect yarn from lock file', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('yarn.lock');
    });

    const pm = detectPackageManager('/test');
    expect(pm).toBe('yarn');
  });

  it('should detect npm from lock file', () => {
    vi.mocked(existsSync).mockImplementation((path: string) => {
      return path.includes('package-lock.json');
    });

    const pm = detectPackageManager('/test');
    expect(pm).toBe('npm');
  });

  it('should default to npm when no lock file found', () => {
    vi.mocked(existsSync).mockReturnValue(false);

    const pm = detectPackageManager('/test');
    expect(pm).toBe('npm');
  });
});
