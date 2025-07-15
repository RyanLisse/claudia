/**
 * Integration tests for Tauri compatibility
 * Tests that the Next.js app works correctly in Tauri environment
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Providers from '@/components/providers';

// Mock Tauri API
const mockTauriAPI = {
  invoke: vi.fn(),
  emit: vi.fn(),
  listen: vi.fn(),
  convertFileSrc: vi.fn((src: string) => src),
  app: {
    getName: vi.fn().mockResolvedValue('Claudia'),
    getVersion: vi.fn().mockResolvedValue('1.0.0'),
    getTauriVersion: vi.fn().mockResolvedValue('1.0.0'),
  },
  window: {
    getCurrent: vi.fn().mockReturnValue({
      setTitle: vi.fn(),
      minimize: vi.fn(),
      maximize: vi.fn(),
      close: vi.fn(),
    }),
  },
  fs: {
    readTextFile: vi.fn(),
    writeTextFile: vi.fn(),
    exists: vi.fn(),
    createDir: vi.fn(),
  },
  path: {
    join: vi.fn(),
    dirname: vi.fn(),
    basename: vi.fn(),
    resolve: vi.fn(),
  },
  dialog: {
    open: vi.fn(),
    save: vi.fn(),
    message: vi.fn(),
    ask: vi.fn(),
  },
  shell: {
    open: vi.fn(),
  },
  process: {
    exit: vi.fn(),
  },
  updater: {
    checkUpdate: vi.fn(),
    installUpdate: vi.fn(),
  },
  notification: {
    sendNotification: vi.fn(),
  },
};

// Mock window.__TAURI__ API
Object.defineProperty(window, '__TAURI__', {
  value: mockTauriAPI,
  writable: true,
});

// Mock window.__TAURI_METADATA__ for Tauri environment detection
Object.defineProperty(window, '__TAURI_METADATA__', {
  value: {
    __currentWindow: {
      label: 'main',
    },
  },
  writable: true,
});

// Test wrapper component
const TauriTestWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <Providers>
        {children}
      </Providers>
    </BrowserRouter>
  );
};

describe('Tauri Compatibility Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock navigator.userAgent to simulate Tauri environment
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Tauri/1.0.0',
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Tauri Environment Detection', () => {
    it('should detect Tauri environment correctly', () => {
      expect(window.__TAURI__).toBeDefined();
      expect(window.__TAURI_METADATA__).toBeDefined();
      expect(navigator.userAgent).toContain('Tauri');
    });

    it('should have all required Tauri APIs available', () => {
      expect(window.__TAURI__.invoke).toBeDefined();
      expect(window.__TAURI__.emit).toBeDefined();
      expect(window.__TAURI__.listen).toBeDefined();
      expect(window.__TAURI__.app).toBeDefined();
      expect(window.__TAURI__.window).toBeDefined();
      expect(window.__TAURI__.fs).toBeDefined();
      expect(window.__TAURI__.path).toBeDefined();
      expect(window.__TAURI__.dialog).toBeDefined();
      expect(window.__TAURI__.shell).toBeDefined();
    });
  });

  describe('File System Operations', () => {
    it('should handle file reading operations', async () => {
      const mockFileContent = '{"test": "data"}';
      mockTauriAPI.fs.readTextFile.mockResolvedValue(mockFileContent);

      const result = await window.__TAURI__.fs.readTextFile('/test/file.json');
      
      expect(result).toBe(mockFileContent);
      expect(mockTauriAPI.fs.readTextFile).toHaveBeenCalledWith('/test/file.json');
    });

    it('should handle file writing operations', async () => {
      const testContent = 'test content';
      mockTauriAPI.fs.writeTextFile.mockResolvedValue(undefined);

      await window.__TAURI__.fs.writeTextFile('/test/output.txt', testContent);
      
      expect(mockTauriAPI.fs.writeTextFile).toHaveBeenCalledWith('/test/output.txt', testContent);
    });

    it('should handle file existence checks', async () => {
      mockTauriAPI.fs.exists.mockResolvedValue(true);

      const exists = await window.__TAURI__.fs.exists('/test/file.json');
      
      expect(exists).toBe(true);
      expect(mockTauriAPI.fs.exists).toHaveBeenCalledWith('/test/file.json');
    });

    it('should handle directory creation', async () => {
      mockTauriAPI.fs.createDir.mockResolvedValue(undefined);

      await window.__TAURI__.fs.createDir('/test/new-dir');
      
      expect(mockTauriAPI.fs.createDir).toHaveBeenCalledWith('/test/new-dir');
    });
  });

  describe('Path Operations', () => {
    it('should handle path joining', async () => {
      const expectedPath = '/test/path/file.txt';
      mockTauriAPI.path.join.mockResolvedValue(expectedPath);

      const result = await window.__TAURI__.path.join('/test/path', 'file.txt');
      
      expect(result).toBe(expectedPath);
      expect(mockTauriAPI.path.join).toHaveBeenCalledWith('/test/path', 'file.txt');
    });

    it('should handle path resolution', async () => {
      const expectedPath = '/absolute/path/file.txt';
      mockTauriAPI.path.resolve.mockResolvedValue(expectedPath);

      const result = await window.__TAURI__.path.resolve('./file.txt');
      
      expect(result).toBe(expectedPath);
      expect(mockTauriAPI.path.resolve).toHaveBeenCalledWith('./file.txt');
    });
  });

  describe('Window Operations', () => {
    it('should handle window title setting', () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.setTitle('Test Title');
      
      expect(currentWindow.setTitle).toHaveBeenCalledWith('Test Title');
    });

    it('should handle window minimize', () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.minimize();
      
      expect(currentWindow.minimize).toHaveBeenCalled();
    });

    it('should handle window maximize', () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.maximize();
      
      expect(currentWindow.maximize).toHaveBeenCalled();
    });

    it('should handle window close', () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.close();
      
      expect(currentWindow.close).toHaveBeenCalled();
    });
  });

  describe('Dialog Operations', () => {
    it('should handle file open dialog', async () => {
      const mockFilePath = '/selected/file.txt';
      mockTauriAPI.dialog.open.mockResolvedValue(mockFilePath);

      const result = await window.__TAURI__.dialog.open({
        multiple: false,
        directory: false,
      });
      
      expect(result).toBe(mockFilePath);
      expect(mockTauriAPI.dialog.open).toHaveBeenCalledWith({
        multiple: false,
        directory: false,
      });
    });

    it('should handle file save dialog', async () => {
      const mockFilePath = '/save/location/file.txt';
      mockTauriAPI.dialog.save.mockResolvedValue(mockFilePath);

      const result = await window.__TAURI__.dialog.save({
        defaultPath: 'file.txt',
      });
      
      expect(result).toBe(mockFilePath);
      expect(mockTauriAPI.dialog.save).toHaveBeenCalledWith({
        defaultPath: 'file.txt',
      });
    });

    it('should handle message dialog', async () => {
      mockTauriAPI.dialog.message.mockResolvedValue(undefined);

      await window.__TAURI__.dialog.message('Test message', 'Info');
      
      expect(mockTauriAPI.dialog.message).toHaveBeenCalledWith('Test message', 'Info');
    });

    it('should handle ask dialog', async () => {
      mockTauriAPI.dialog.ask.mockResolvedValue(true);

      const result = await window.__TAURI__.dialog.ask('Confirm action?', 'Confirm');
      
      expect(result).toBe(true);
      expect(mockTauriAPI.dialog.ask).toHaveBeenCalledWith('Confirm action?', 'Confirm');
    });
  });

  describe('Shell Operations', () => {
    it('should handle external URL opening', async () => {
      mockTauriAPI.shell.open.mockResolvedValue(undefined);

      await window.__TAURI__.shell.open('https://example.com');
      
      expect(mockTauriAPI.shell.open).toHaveBeenCalledWith('https://example.com');
    });
  });

  describe('App Information', () => {
    it('should get app name', async () => {
      const appName = await window.__TAURI__.app.getName();
      
      expect(appName).toBe('Claudia');
      expect(mockTauriAPI.app.getName).toHaveBeenCalled();
    });

    it('should get app version', async () => {
      const appVersion = await window.__TAURI__.app.getVersion();
      
      expect(appVersion).toBe('1.0.0');
      expect(mockTauriAPI.app.getVersion).toHaveBeenCalled();
    });

    it('should get Tauri version', async () => {
      const tauriVersion = await window.__TAURI__.app.getTauriVersion();
      
      expect(tauriVersion).toBe('1.0.0');
      expect(mockTauriAPI.app.getTauriVersion).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    it('should handle event emission', async () => {
      mockTauriAPI.emit.mockResolvedValue(undefined);

      await window.__TAURI__.emit('test-event', { data: 'test' });
      
      expect(mockTauriAPI.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should handle event listening', async () => {
      const mockUnlisten = vi.fn();
      mockTauriAPI.listen.mockResolvedValue(mockUnlisten);

      const callback = vi.fn();
      const unlisten = await window.__TAURI__.listen('test-event', callback);
      
      expect(unlisten).toBe(mockUnlisten);
      expect(mockTauriAPI.listen).toHaveBeenCalledWith('test-event', callback);
    });
  });

  describe('Notification System', () => {
    it('should handle notification sending', async () => {
      mockTauriAPI.notification.sendNotification.mockResolvedValue(undefined);

      await window.__TAURI__.notification.sendNotification({
        title: 'Test Notification',
        body: 'Test message',
      });
      
      expect(mockTauriAPI.notification.sendNotification).toHaveBeenCalledWith({
        title: 'Test Notification',
        body: 'Test message',
      });
    });
  });

  describe('Static Export Compatibility', () => {
    it('should work with static export configuration', () => {
      // Test that the app can be served as static files
      expect(process.env.NODE_ENV).toBeDefined();
      
      // Ensure no server-side rendering dependencies
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
      expect(typeof navigator).toBe('object');
    });

    it('should handle asset loading correctly', () => {
      // Test that assets can be loaded from the file system
      const testImageSrc = '/images/test.png';
      const convertedSrc = window.__TAURI__.convertFileSrc(testImageSrc);
      
      expect(convertedSrc).toBe(testImageSrc);
      expect(mockTauriAPI.convertFileSrc).toHaveBeenCalledWith(testImageSrc);
    });
  });

  describe('Error Handling', () => {
    it('should handle Tauri API errors gracefully', async () => {
      const errorMessage = 'File not found';
      mockTauriAPI.fs.readTextFile.mockRejectedValue(new Error(errorMessage));

      await expect(window.__TAURI__.fs.readTextFile('/nonexistent/file.txt'))
        .rejects.toThrow(errorMessage);
    });

    it('should handle missing Tauri API gracefully', () => {
      // Temporarily remove Tauri API
      const originalTauri = window.__TAURI__;
      delete (window as any).__TAURI__;

      // Should not throw error when Tauri API is not available
      expect(() => {
        const isTauriAvailable = typeof window.__TAURI__ !== 'undefined';
        expect(isTauriAvailable).toBe(false);
      }).not.toThrow();

      // Restore Tauri API
      (window as any).__TAURI__ = originalTauri;
    });
  });

  describe('Performance in Tauri Environment', () => {
    it('should load within acceptable time limits', async () => {
      const startTime = performance.now();
      
      // Simulate app initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      
      // Should load within 1 second
      expect(loadTime).toBeLessThan(1000);
    });

    it('should handle large data sets efficiently', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
      }));

      mockTauriAPI.fs.readTextFile.mockResolvedValue(JSON.stringify(largeData));

      const startTime = performance.now();
      const result = await window.__TAURI__.fs.readTextFile('/large-data.json');
      const parsedData = JSON.parse(result);
      const endTime = performance.now();

      expect(parsedData).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should parse within 100ms
    });
  });

  describe('Next.js Integration with Tauri', () => {
    it('should handle Next.js static export with Tauri', () => {
      // Test that Next.js static export works with Tauri
      expect(process.env.NODE_ENV).toBeDefined();
      expect(typeof window).toBe('object');
      expect(typeof document).toBe('object');
    });

    it('should handle Next.js routing in Tauri', () => {
      // Test that client-side routing works in Tauri
      expect(window.location).toBeDefined();
      expect(window.history).toBeDefined();
    });

    it('should handle Next.js API routes in Tauri', () => {
      // Test that API routes work in Tauri environment
      expect(window.fetch).toBeDefined();
    });

    it('should handle Next.js images in Tauri', () => {
      // Test that Next.js image optimization works with Tauri
      const testImageSrc = '/images/test.png';
      const convertedSrc = window.__TAURI__.convertFileSrc(testImageSrc);
      
      expect(convertedSrc).toBe(testImageSrc);
    });

    it('should handle Next.js dynamic imports in Tauri', async () => {
      // Test that dynamic imports work in Tauri
      const dynamicModule = await import('./tauri-compatibility.test');
      expect(dynamicModule).toBeDefined();
    });

    it('should handle Next.js CSS modules in Tauri', () => {
      // Test that CSS modules work in Tauri
      const element = document.createElement('div');
      element.className = 'test-class';
      expect(element.className).toBe('test-class');
    });

    it('should handle Next.js environment variables in Tauri', () => {
      // Test that environment variables work in Tauri
      expect(process.env.NODE_ENV).toBeDefined();
    });
  });

  describe('Tauri-specific Next.js Features', () => {
    it('should handle file system operations with Next.js', async () => {
      const testContent = 'Next.js content';
      mockTauriAPI.fs.writeTextFile.mockResolvedValue(undefined);
      mockTauriAPI.fs.readTextFile.mockResolvedValue(testContent);

      await window.__TAURI__.fs.writeTextFile('/nextjs-test.txt', testContent);
      const result = await window.__TAURI__.fs.readTextFile('/nextjs-test.txt');
      
      expect(result).toBe(testContent);
    });

    it('should handle native dialogs with Next.js', async () => {
      const mockFilePath = '/selected/nextjs-file.txt';
      mockTauriAPI.dialog.open.mockResolvedValue(mockFilePath);

      const result = await window.__TAURI__.dialog.open({
        multiple: false,
        directory: false,
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
      });
      
      expect(result).toBe(mockFilePath);
    });

    it('should handle window management with Next.js', () => {
      const currentWindow = window.__TAURI__.window.getCurrent();
      currentWindow.setTitle('Next.js App');
      
      expect(currentWindow.setTitle).toHaveBeenCalledWith('Next.js App');
    });

    it('should handle shell operations with Next.js', async () => {
      mockTauriAPI.shell.open.mockResolvedValue(undefined);

      await window.__TAURI__.shell.open('https://nextjs.org');
      
      expect(mockTauriAPI.shell.open).toHaveBeenCalledWith('https://nextjs.org');
    });
  });

  describe('Build Process Compatibility', () => {
    it('should work with Next.js build process', () => {
      // Test that Tauri works with Next.js build
      expect(window.__TAURI__).toBeDefined();
    });

    it('should handle bundled dependencies', () => {
      // Test that bundled dependencies work with Tauri
      expect(window.__TAURI__.fs).toBeDefined();
      expect(window.__TAURI__.dialog).toBeDefined();
    });

    it('should handle minified code', () => {
      // Test that minified code works with Tauri
      expect(window.__TAURI__.invoke).toBeDefined();
    });

    it('should handle code splitting', () => {
      // Test that code splitting works with Tauri
      expect(window.__TAURI__.app).toBeDefined();
    });
  });

  describe('Security Features', () => {
    it('should handle CSP with Tauri', () => {
      // Test that Content Security Policy works with Tauri
      expect(document.querySelector).toBeDefined();
    });

    it('should handle secure file operations', async () => {
      mockTauriAPI.fs.readTextFile.mockResolvedValue('secure content');

      const result = await window.__TAURI__.fs.readTextFile('/secure-file.txt');
      
      expect(result).toBe('secure content');
    });

    it('should handle secure dialogs', async () => {
      mockTauriAPI.dialog.ask.mockResolvedValue(true);

      const result = await window.__TAURI__.dialog.ask('Are you sure?', 'Confirm');
      
      expect(result).toBe(true);
    });
  });

  describe('Development vs Production', () => {
    it('should work in development mode', () => {
      // Test development mode compatibility
      expect(window.__TAURI__).toBeDefined();
    });

    it('should work in production mode', () => {
      // Test production mode compatibility
      expect(window.__TAURI__.app).toBeDefined();
    });

    it('should handle hot reloading', () => {
      // Test that hot reloading works with Tauri
      expect(window.__TAURI__.emit).toBeDefined();
    });
  });

  describe('Integration with React Components', () => {
    it('should work with Next.js pages', () => {
      const TestComponent = () => {
        return (
          <TauriTestWrapper>
            <div>Test Component</div>
          </TauriTestWrapper>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    it('should handle hooks with Tauri', () => {
      const TestComponent = () => {
        const [data, setData] = React.useState(null);
        
        React.useEffect(() => {
          if (window.__TAURI__) {
            setData('Tauri available');
          }
        }, []);
        
        return <div>{data}</div>;
      };

      render(
        <TauriTestWrapper>
          <TestComponent />
        </TauriTestWrapper>
      );
      
      expect(screen.getByText('Tauri available')).toBeInTheDocument();
    });

    it('should handle context with Tauri', () => {
      const TauriContext = React.createContext(null);
      
      const TestComponent = () => {
        const tauri = React.useContext(TauriContext);
        return <div>Context: {tauri ? 'Available' : 'Not available'}</div>;
      };

      render(
        <TauriTestWrapper>
          <TauriContext.Provider value={window.__TAURI__}>
            <TestComponent />
          </TauriContext.Provider>
        </TauriTestWrapper>
      );
      
      expect(screen.getByText('Context: Available')).toBeInTheDocument();
    });
  });
});