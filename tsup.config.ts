import { defineConfig } from 'tsup';
import { copyFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// Copy template files to dist after build
function copyTemplates() {
  const srcTemplateDir = join(process.cwd(), 'src', 'templates', 'template-files');
  const distTemplateDir = join(process.cwd(), 'dist', 'templates', 'template-files');
  
  if (!existsSync(srcTemplateDir)) {
    return;
  }
  
  function copyRecursive(src: string, dest: string) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    
    const entries = readdirSync(src);
    for (const entry of entries) {
      const srcPath = join(src, entry);
      const destPath = join(dest, entry);
      const stat = statSync(srcPath);
      
      if (stat.isDirectory()) {
        copyRecursive(srcPath, destPath);
      } else {
        copyFileSync(srcPath, destPath);
      }
    }
  }
  
  copyRecursive(srcTemplateDir, distTemplateDir);
}

export default defineConfig({
  entry: ['src/cli/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  treeshake: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  esbuildOptions(options) {
    options.platform = 'node';
  },
  onSuccess: copyTemplates,
});

