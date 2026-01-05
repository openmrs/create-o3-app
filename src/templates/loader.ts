import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { handleTemplateError } from '../utils/error-handler.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface TemplateInfo {
  version: string;
  path: string;
}

/**
 * Get the path to the embedded template
 */
export function getTemplatePath(_version?: string): string {
  // Check if templates exist in dist (built) or src (development)
  // In dist: dist/templates/template-files/ (when running from dist/index.js, __dirname is dist/)
  // In src: src/templates/template-files/
  const distPath = join(__dirname, 'templates', 'template-files');
  const srcPath = join(__dirname, '..', '..', 'src', 'templates', 'template-files');

  if (existsSync(distPath)) {
    return distPath;
  }

  if (existsSync(srcPath)) {
    return srcPath;
  }

  // Fallback to dist path
  return distPath;
}

/**
 * Check if templates are available
 */
export function isTemplateAvailable(): boolean {
  const templatePath = getTemplatePath();
  return existsSync(templatePath) && existsSync(join(templatePath, 'package.json'));
}

/**
 * Get template info
 * Templates are now embedded, so version is ignored but kept for API compatibility
 */
export async function getTemplateInfo(version = 'latest'): Promise<TemplateInfo> {
  const templatePath = getTemplatePath();

  if (!isTemplateAvailable()) {
    const message = 'Embedded templates not found';
    const suggestions = [
      'Reinstall the CLI package',
      'Check that template files are included in the package',
      'Report this issue: https://github.com/openmrs/create-o3-app/issues',
    ];
    handleTemplateError(message, templatePath, suggestions);
  }

  logger.debug('Using embedded template', { version, templatePath });

  return {
    version,
    path: templatePath,
  };
}
