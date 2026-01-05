import { simpleGit, SimpleGit } from 'simple-git';
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

    // Create initial commit
    await git.add('.');
    await git.commit('Initial commit: scaffold O3 module');

    logger.success('Git repository initialized');
  } catch (error) {
    logger.warn('Failed to initialize git repository');
    logger.debug('Git init error', error);
    // Don't throw - git init is optional
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
