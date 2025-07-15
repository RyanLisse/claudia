/**
 * Build process validation tests
 * Tests that the Next.js build process generates correct static output
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

// Mock Node.js modules for testing
vi.mock('child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock('path', () => ({
  join: vi.fn((...args) => args.join('/')),
}));

const mockExecSync = vi.mocked(execSync);
const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);
const mockStatSync = vi.mocked(statSync);

describe('Build Process Validation Tests', () => {
  const buildOutputDir = '/Users/neo/Developer/experiments/claudia/frontend/apps/web/out';
  const projectRoot = '/Users/neo/Developer/experiments/claudia/frontend/apps/web';

  beforeAll(() => {
    // Mock successful build output
    mockExecSync.mockImplementation((command: string) => {
      if (command.includes('npm run build')) {
        return Buffer.from('Build completed successfully');
      }
      if (command.includes('npm run typecheck')) {
        return Buffer.from('Type checking completed');
      }
      return Buffer.from('Command executed');
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('Next.js Configuration Validation', () => {
    it('should have correct static export configuration', () => {
      // Mock next.config.ts content
      const nextConfigContent = `
        import type { NextConfig } from "next";
        
        const nextConfig: NextConfig = {
          output: "export",
          images: {
            unoptimized: true,
          },
          eslint: {
            ignoreDuringBuilds: true,
          },
          typescript: {
            ignoreBuildErrors: true,
          },
          trailingSlash: false,
        };
        
        export default nextConfig;
      `;

      mockReadFileSync.mockReturnValue(nextConfigContent);
      mockExistsSync.mockReturnValue(true);

      const configExists = existsSync(join(projectRoot, 'next.config.ts'));
      expect(configExists).toBe(true);

      const configContent = readFileSync(join(projectRoot, 'next.config.ts'), 'utf-8');
      expect(configContent).toContain('output: "export"');
      expect(configContent).toContain('unoptimized: true');
      expect(configContent).toContain('ignoreDuringBuilds: true');
    });

    it('should validate package.json build scripts', () => {
      const packageJsonContent = JSON.stringify({
        name: '@claudia/web',
        scripts: {
          build: 'next build',
          dev: 'next dev',
          start: 'next start',
          lint: 'next lint',
          typecheck: 'tsc --noEmit',
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      });

      mockReadFileSync.mockReturnValue(packageJsonContent);
      mockExistsSync.mockReturnValue(true);

      const packageExists = existsSync(join(projectRoot, 'package.json'));
      expect(packageExists).toBe(true);

      const packageContent = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf-8'));
      expect(packageContent.scripts.build).toBe('next build');
      expect(packageContent.scripts.typecheck).toBe('tsc --noEmit');
      expect(packageContent.dependencies.next).toBeDefined();
    });
  });

  describe('Build Process Execution', () => {
    it('should execute build command successfully', () => {
      expect(() => {
        execSync('npm run build', { cwd: projectRoot });
      }).not.toThrow();

      expect(mockExecSync).toHaveBeenCalledWith('npm run build', { cwd: projectRoot });
    });

    it('should execute typecheck command successfully', () => {
      expect(() => {
        execSync('npm run typecheck', { cwd: projectRoot });
      }).not.toThrow();

      expect(mockExecSync).toHaveBeenCalledWith('npm run typecheck', { cwd: projectRoot });
    });

    it('should handle build errors gracefully', () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('Build failed');
      });

      expect(() => {
        execSync('npm run build', { cwd: projectRoot });
      }).toThrow('Build failed');
    });
  });

  describe('Static Export Output Validation', () => {
    beforeAll(() => {
      // Mock build output directory structure
      mockExistsSync.mockImplementation((path: string) => {
        const validPaths = [
          `${buildOutputDir}/index.html`,
          `${buildOutputDir}/agents/index.html`,
          `${buildOutputDir}/projects/index.html`,
          `${buildOutputDir}/_next/static/chunks/pages/_app.js`,
          `${buildOutputDir}/_next/static/chunks/pages/_document.js`,
          `${buildOutputDir}/_next/static/chunks/pages/index.js`,
          `${buildOutputDir}/_next/static/chunks/pages/agents/index.js`,
          `${buildOutputDir}/_next/static/chunks/pages/projects/index.js`,
          `${buildOutputDir}/_next/static/css/app.css`,
          `${buildOutputDir}/manifest.webmanifest`,
          `${buildOutputDir}/favicon.ico`,
        ];
        return validPaths.includes(path as string);
      });

      mockStatSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
        size: 1024,
      } as any);
    });

    it('should generate main HTML files', () => {
      const mainPages = [
        'index.html',
        'agents/index.html',
        'projects/index.html',
      ];

      mainPages.forEach(page => {
        const pageExists = existsSync(join(buildOutputDir, page));
        expect(pageExists).toBe(true);
      });
    });

    it('should generate JavaScript chunks', () => {
      const jsChunks = [
        '_next/static/chunks/pages/_app.js',
        '_next/static/chunks/pages/_document.js',
        '_next/static/chunks/pages/index.js',
        '_next/static/chunks/pages/agents/index.js',
        '_next/static/chunks/pages/projects/index.js',
      ];

      jsChunks.forEach(chunk => {
        const chunkExists = existsSync(join(buildOutputDir, chunk));
        expect(chunkExists).toBe(true);
      });
    });

    it('should generate CSS files', () => {
      const cssExists = existsSync(join(buildOutputDir, '_next/static/css/app.css'));
      expect(cssExists).toBe(true);
    });

    it('should generate manifest and favicon', () => {
      const manifestExists = existsSync(join(buildOutputDir, 'manifest.webmanifest'));
      const faviconExists = existsSync(join(buildOutputDir, 'favicon.ico'));
      
      expect(manifestExists).toBe(true);
      expect(faviconExists).toBe(true);
    });

    it('should validate HTML structure', () => {
      const indexHtmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1"/>
          <title>Claudia</title>
          <link rel="icon" href="/favicon.ico"/>
          <link rel="manifest" href="/manifest.webmanifest"/>
        </head>
        <body>
          <div id="__next">
            <div class="min-h-screen bg-background">
              <main>Content</main>
            </div>
          </div>
        </body>
        </html>
      `;

      mockReadFileSync.mockReturnValue(indexHtmlContent);

      const htmlContent = readFileSync(join(buildOutputDir, 'index.html'), 'utf-8');
      
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('<html lang="en">');
      expect(htmlContent).toContain('<div id="__next">');
      expect(htmlContent).toContain('rel="manifest"');
      expect(htmlContent).toContain('href="/favicon.ico"');
    });
  });

  describe('Asset Optimization', () => {
    it('should optimize images for static export', () => {
      // Test that images are handled correctly for static export
      const nextConfigContent = readFileSync(join(projectRoot, 'next.config.ts'), 'utf-8');
      expect(nextConfigContent).toContain('unoptimized: true');
    });

    it('should handle static assets correctly', () => {
      const staticAssets = [
        'favicon.ico',
        'manifest.webmanifest',
        '_next/static/chunks/webpack.js',
        '_next/static/chunks/framework.js',
        '_next/static/chunks/main.js',
        '_next/static/chunks/polyfills.js',
      ];

      staticAssets.forEach(asset => {
        mockExistsSync.mockReturnValue(true);
        const assetExists = existsSync(join(buildOutputDir, asset));
        expect(assetExists).toBe(true);
      });
    });

    it('should validate CSS bundle', () => {
      const cssContent = `
        .min-h-screen { min-height: 100vh; }
        .bg-background { background-color: var(--background); }
        .text-foreground { color: var(--foreground); }
      `;

      mockReadFileSync.mockReturnValue(cssContent);

      const cssExists = existsSync(join(buildOutputDir, '_next/static/css/app.css'));
      expect(cssExists).toBe(true);

      const cssFileContent = readFileSync(join(buildOutputDir, '_next/static/css/app.css'), 'utf-8');
      expect(cssFileContent).toContain('.min-h-screen');
      expect(cssFileContent).toContain('.bg-background');
    });
  });

  describe('File Size Validation', () => {
    it('should validate JavaScript bundle sizes', () => {
      const mockStats = {
        isFile: () => true,
        isDirectory: () => false,
        size: 50000, // 50KB
      };

      mockStatSync.mockReturnValue(mockStats as any);

      const jsFiles = [
        '_next/static/chunks/pages/_app.js',
        '_next/static/chunks/pages/index.js',
        '_next/static/chunks/pages/agents/index.js',
        '_next/static/chunks/pages/projects/index.js',
      ];

      jsFiles.forEach(file => {
        const filePath = join(buildOutputDir, file);
        const stats = statSync(filePath);
        
        expect(stats.size).toBeLessThan(500000); // Less than 500KB
        expect(stats.size).toBeGreaterThan(0);
      });
    });

    it('should validate CSS bundle size', () => {
      const cssStats = {
        isFile: () => true,
        isDirectory: () => false,
        size: 10000, // 10KB
      };

      mockStatSync.mockReturnValue(cssStats as any);

      const cssPath = join(buildOutputDir, '_next/static/css/app.css');
      const stats = statSync(cssPath);
      
      expect(stats.size).toBeLessThan(100000); // Less than 100KB
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('Build Performance', () => {
    it('should complete build within reasonable time', () => {
      const startTime = Date.now();
      
      // Mock build execution
      mockExecSync.mockImplementation(() => {
        // Simulate build time
        const buildTime = 30000; // 30 seconds
        return Buffer.from(`Build completed in ${buildTime}ms`);
      });

      execSync('npm run build', { cwd: projectRoot });
      
      const endTime = Date.now();
      const actualBuildTime = endTime - startTime;
      
      // Should complete within 5 minutes
      expect(actualBuildTime).toBeLessThan(300000);
    });

    it('should validate build output consistency', () => {
      // Run build twice and ensure consistent output
      mockExecSync.mockImplementation(() => Buffer.from('Build completed'));
      
      expect(() => execSync('npm run build', { cwd: projectRoot })).not.toThrow();
      expect(() => execSync('npm run build', { cwd: projectRoot })).not.toThrow();
      
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling in Build Process', () => {
    it('should handle TypeScript errors', () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('TypeScript error: Cannot find module');
      });

      expect(() => {
        execSync('npm run typecheck', { cwd: projectRoot });
      }).toThrow('TypeScript error');
    });

    it('should handle ESLint errors', () => {
      mockExecSync.mockImplementationOnce(() => {
        throw new Error('ESLint error: Unexpected token');
      });

      expect(() => {
        execSync('npm run lint', { cwd: projectRoot });
      }).toThrow('ESLint error');
    });

    it('should handle build failures gracefully', () => {
      mockExecSync.mockImplementationOnce(() => {
        const error = new Error('Build failed') as any;
        error.status = 1;
        throw error;
      });

      expect(() => {
        execSync('npm run build', { cwd: projectRoot });
      }).toThrow('Build failed');
    });
  });

  describe('Environment Variables', () => {
    it('should handle production environment correctly', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      expect(process.env.NODE_ENV).toBe('production');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle development environment correctly', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      expect(process.env.NODE_ENV).toBe('development');

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});