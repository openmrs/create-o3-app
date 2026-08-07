import { simpleGit, type SimpleGit } from 'simple-git';
import { logger } from './logger.js';

/**
 * Initialize git repository
 */
export async function initializeGit(projectPath: string): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(projectPath);

    // Check if already a git repo
    const isRepo = await git.checkIsRepo();
    if (isRepo) {
      return;
    }

    // Initialize repository
    try {
      await git.init(['--initial-branch=main']);
    } catch {
      await git.init();
      try {
        await git.branch(['-M', 'main']);
      } catch {
        // Best-effort; continue if branch rename fails
      }
    }

    logger.success('Git repository initialized');
  } catch (error) {
    logger.warn('Failed to initialize git repository');
    logger.debug('Git init error', error);
    // Don't throw - git init is optional
  }
}

/**
 * Create the initial commit. Kept separate from initializeGit so it can run
 * after dependency installation: committing first left the fresh scaffold
 * immediately dirty, with an install-reordered package.json and an untracked
 * yarn.lock.
 */
export async function createInitialCommit(projectPath: string): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(projectPath);
    const status = await git.status();
    if (status.files.length === 0) {
      return;
    }
    await git.add('.');
    await git.commit('Initial commit: scaffold O3 module');
    logger.success('Created initial commit');
  } catch (error) {
    logger.warn('Failed to create the initial commit');
    logger.debug('Git commit error', error);
    // Don't throw - git is optional
  }
}

/**
 * Setup git remote (if provided)
 */
export async function setupGitRemote(projectPath: string, remoteUrl: string): Promise<void> {
  try {
    const git: SimpleGit = simpleGit(projectPath);
    await git.addRemote('origin', remoteUrl);
    logger.success(`Git remote added: ${remoteUrl}`);
  } catch (error) {
    logger.warn('Failed to setup git remote');
    logger.debug('Git remote error', error);
    // Don't throw - git remote setup is optional
  }
}
