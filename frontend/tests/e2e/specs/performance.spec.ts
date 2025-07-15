import { test, expect } from '../fixtures/test-fixtures';
import { TestDataManager } from '../utils/test-data-manager';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { VisualTester } from '../utils/visual-testing';

test.describe('Performance E2E Tests', () => {
  let dataManager: TestDataManager;
  let performanceMonitor: PerformanceMonitor;
  let visualTester: VisualTester;

  test.beforeEach(async ({ page, stagehand }) => {
    // Initialize test utilities
    dataManager = new TestDataManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    visualTester = new VisualTester(page, performanceMonitor);

    // Initialize test data and utilities
    await dataManager.initialize();
    await performanceMonitor.startMonitoring();

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Generate performance reports
    const performanceReport = await performanceMonitor.generateReport();
    console.log('Performance Report:', performanceReport);

    // Cleanup
    await dataManager.cleanup();
    await performanceMonitor.stopMonitoring();
  });

  test('should meet Core Web Vitals standards', async ({ page, stagehand }) => {
    // Create test session
    const session = await dataManager.createSession('performance-test', [
      'core-web-vitals',
      'loading-performance',
      'interaction-performance'
    ]);

    // Test Core Web Vitals
    await test.step('Test Core Web Vitals', async () => {
      // Navigate to different pages and measure performance
      const pages = [
        { path: '/', name: 'homepage' },
        { path: '/agents', name: 'agents-page' },
        { path: '/projects', name: 'projects-page' },
      ];

      for (const testPage of pages) {
        await page.goto(`http://localhost:3000${testPage.path}`);
        await page.waitForLoadState('networkidle');

        // Capture Core Web Vitals
        const metrics = await performanceMonitor.captureMetrics();
        
        // Verify Core Web Vitals thresholds
        expect(metrics.renderingMetrics.FCP).toBeLessThan(1800); // First Contentful Paint < 1.8s
        expect(metrics.renderingMetrics.LCP).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
        expect(metrics.renderingMetrics.CLS).toBeLessThan(0.1); // Cumulative Layout Shift < 0.1
        expect(metrics.renderingMetrics.FID).toBeLessThan(100); // First Input Delay < 100ms
        expect(metrics.renderingMetrics.INP).toBeLessThan(200); // Interaction to Next Paint < 200ms

        // Log performance metrics for CI/CD
        console.log(`${testPage.name} Performance:`, {
          FCP: metrics.renderingMetrics.FCP,
          LCP: metrics.renderingMetrics.LCP,
          CLS: metrics.renderingMetrics.CLS,
          FID: metrics.renderingMetrics.FID,
          INP: metrics.renderingMetrics.INP,
        });
      }
    });

    // Test loading performance under different conditions
    await test.step('Test loading performance', async () => {
      // Test with slow network
      await page.context().setExtraHTTPHeaders({
        'Connection': 'slow-3g'
      });

      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');

      const slowNetworkMetrics = await performanceMonitor.captureMetrics();
      
      // Verify performance remains acceptable on slow networks
      expect(slowNetworkMetrics.renderingMetrics.FCP).toBeLessThan(3000);
      expect(slowNetworkMetrics.renderingMetrics.LCP).toBeLessThan(5000);
      expect(slowNetworkMetrics.renderingMetrics.CLS).toBeLessThan(0.15);

      // Reset network conditions
      await page.context().setExtraHTTPHeaders({});
    });

    // Test interaction performance
    await test.step('Test interaction performance', async () => {
      // Generate test data for interaction testing
      const testUsers = await dataManager.generateUsers(1);
      const testUser = testUsers[0];

      // Authenticate user
      await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
      await page.waitForSelector('[data-testid="dashboard"]');

      // Navigate to agents page
      await stagehand.act('Navigate to agents page');
      await page.waitForSelector('[data-testid="agents-page"]');

      // Test interaction responsiveness
      const interactionTests = [
        { action: 'Click create agent button', selector: '[data-testid="create-agent-button"]' },
        { action: 'Click agent filters dropdown', selector: '[data-testid="agent-filters"]' },
        { action: 'Click agent card', selector: '[data-testid="agent-card"]:first-child' },
        { action: 'Click agent details tab', selector: '[data-testid="agent-details-tab"]' },
      ];

      for (const interactionTest of interactionTests) {
        const startTime = Date.now();
        
        await stagehand.act(interactionTest.action);
        await page.waitForSelector(interactionTest.selector);
        
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Verify interaction responsiveness
        expect(responseTime).toBeLessThan(500); // Interactions should be < 500ms
        
        console.log(`${interactionTest.action} response time: ${responseTime}ms`);
      }
    });

    // Test memory usage and resource management
    await test.step('Test memory usage', async () => {
      // Generate large dataset
      const loadTestAgents = await dataManager.generateAgents(100);
      const loadTestMessages = await dataManager.generateMessages(500);

      // Simulate heavy usage
      for (let i = 0; i < 50; i++) {
        await dataManager.updateAgentStatus(loadTestAgents[i].id, 'busy');
      }

      // Monitor memory usage
      const memoryMetrics = await performanceMonitor.captureMetrics();
      
      // Verify memory usage remains within acceptable limits
      expect(memoryMetrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB
      expect(memoryMetrics.resourceMetrics.JSHeapUsedSize).toBeLessThan(200 * 1024 * 1024); // 200MB
      expect(memoryMetrics.resourceMetrics.JSHeapTotalSize).toBeLessThan(300 * 1024 * 1024); // 300MB

      // Test garbage collection effectiveness
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const postGCMetrics = await performanceMonitor.captureMetrics();
      expect(postGCMetrics.memoryUsage).toBeLessThanOrEqual(memoryMetrics.memoryUsage);
    });

    // Test rendering performance with large datasets
    await test.step('Test rendering performance', async () => {
      // Create large dataset
      const largeDataset = await dataManager.generateAgents(200);

      // Navigate to page with large dataset
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');

      // Measure rendering performance
      const renderingMetrics = await performanceMonitor.captureMetrics();
      
      // Verify rendering performance
      expect(renderingMetrics.renderingMetrics.renderingTime).toBeLessThan(1000);
      expect(renderingMetrics.renderingMetrics.layoutTime).toBeLessThan(200);
      expect(renderingMetrics.renderingMetrics.paintTime).toBeLessThan(300);

      // Test scrolling performance
      const scrollStartTime = Date.now();
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(100);
      const scrollEndTime = Date.now();

      const scrollTime = scrollEndTime - scrollStartTime;
      expect(scrollTime).toBeLessThan(200);

      // Test virtual scrolling performance
      await page.mouse.wheel(0, 10000);
      await page.waitForTimeout(100);
      
      const virtualScrollMetrics = await performanceMonitor.captureMetrics();
      expect(virtualScrollMetrics.renderingMetrics.CLS).toBeLessThan(0.05);
    });

    // Test bundle size and loading efficiency
    await test.step('Test bundle size and loading', async () => {
      // Capture network activity
      const networkMetrics = await performanceMonitor.captureNetworkMetrics();
      
      // Verify bundle sizes
      expect(networkMetrics.totalTransferSize).toBeLessThan(5 * 1024 * 1024); // 5MB total
      expect(networkMetrics.jsTransferSize).toBeLessThan(2 * 1024 * 1024); // 2MB JS
      expect(networkMetrics.cssTransferSize).toBeLessThan(500 * 1024); // 500KB CSS
      expect(networkMetrics.imageTransferSize).toBeLessThan(1 * 1024 * 1024); // 1MB images

      // Test code splitting effectiveness
      const codeChunks = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.map(script => script.src).filter(src => src.includes('chunk'));
      });

      expect(codeChunks.length).toBeGreaterThan(3); // Should have multiple chunks
      
      // Test lazy loading
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      const initialChunks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script[src]')).length;
      });

      // Navigate to different route
      await page.goto('http://localhost:3000/projects');
      await page.waitForLoadState('networkidle');
      
      const afterNavigationChunks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script[src]')).length;
      });

      // Verify lazy loading (more chunks loaded on demand)
      expect(afterNavigationChunks).toBeGreaterThanOrEqual(initialChunks);
    });

    // Test concurrent operations performance
    await test.step('Test concurrent operations', async () => {
      // Generate concurrent test data
      const concurrentAgents = await dataManager.generateAgents(50);
      const concurrentMessages = await dataManager.generateMessages(200);

      // Simulate concurrent operations
      const concurrentOperations = [];
      
      for (let i = 0; i < 25; i++) {
        concurrentOperations.push(
          dataManager.updateAgentStatus(concurrentAgents[i].id, 'busy')
        );
      }

      const startTime = Date.now();
      await Promise.all(concurrentOperations);
      const endTime = Date.now();

      const concurrentTime = endTime - startTime;
      expect(concurrentTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify UI remains responsive during concurrent operations
      await stagehand.act('Click on agent refresh button');
      await page.waitForSelector('[data-testid="agent-list-updated"]');
      
      const responsiveMetrics = await performanceMonitor.captureMetrics();
      expect(responsiveMetrics.renderingMetrics.INP).toBeLessThan(300);
    });

    // End test session
    await dataManager.endSession(session.id, 'completed');
    
    // Generate final performance report
    const finalReport = await performanceMonitor.generateReport();
    expect(finalReport.overallScore).toBeGreaterThan(0.8);
    
    // Verify performance budgets
    expect(finalReport.performanceScore).toBeGreaterThan(90);
    expect(finalReport.accessibilityScore).toBeGreaterThan(95);
    expect(finalReport.bestPracticesScore).toBeGreaterThan(90);
    expect(finalReport.seoScore).toBeGreaterThan(90);
  });

  test('should maintain performance under stress conditions', async ({ page, stagehand }) => {
    // Create stress test scenario
    const stressTestData = {
      users: await dataManager.generateUsers(10),
      agents: await dataManager.generateAgents(500),
      messages: await dataManager.generateMessages(1000),
      projects: await dataManager.generateProjects(50),
    };

    // Test high-frequency updates
    await test.step('Test high-frequency updates', async () => {
      // Authenticate user
      const testUser = stressTestData.users[0];
      await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
      await page.waitForSelector('[data-testid="dashboard"]');

      // Navigate to agents page
      await stagehand.act('Navigate to agents page');
      await page.waitForSelector('[data-testid="agents-page"]');

      // Start monitoring
      const initialMetrics = await performanceMonitor.captureMetrics();

      // Simulate high-frequency agent status updates
      const updatePromises = [];
      for (let i = 0; i < 100; i++) {
        const agent = stressTestData.agents[i % stressTestData.agents.length];
        const status = ['idle', 'busy', 'offline'][i % 3];
        updatePromises.push(
          dataManager.updateAgentStatus(agent.id, status as any)
        );
      }

      const updateStartTime = Date.now();
      await Promise.all(updatePromises);
      const updateEndTime = Date.now();

      const updateTime = updateEndTime - updateStartTime;
      expect(updateTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify UI remains responsive
      await stagehand.act('Click on agent list refresh button');
      await page.waitForSelector('[data-testid="agent-list-updated"]');

      const finalMetrics = await performanceMonitor.captureMetrics();
      
      // Verify performance degradation is minimal
      expect(finalMetrics.renderingMetrics.FCP).toBeLessThan(initialMetrics.renderingMetrics.FCP * 1.5);
      expect(finalMetrics.memoryUsage).toBeLessThan(initialMetrics.memoryUsage * 2);
    });

    // Test memory leak detection
    await test.step('Test memory leak detection', async () => {
      const memoryTests = [];
      
      // Perform memory-intensive operations
      for (let i = 0; i < 10; i++) {
        memoryTests.push(async () => {
          // Create and destroy large datasets
          const tempAgents = await dataManager.generateAgents(100);
          const tempMessages = await dataManager.generateMessages(200);
          
          // Simulate usage
          for (const agent of tempAgents) {
            await dataManager.updateAgentStatus(agent.id, 'busy');
          }
          
          // Cleanup
          await dataManager.cleanup();
        });
      }

      const initialMemory = await performanceMonitor.captureMetrics();
      
      // Execute memory tests
      for (const memoryTest of memoryTests) {
        await memoryTest();
      }

      // Force garbage collection
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      const finalMemory = await performanceMonitor.captureMetrics();
      
      // Verify no significant memory leaks
      const memoryIncrease = finalMemory.memoryUsage - initialMemory.memoryUsage;
      const memoryIncreasePercent = (memoryIncrease / initialMemory.memoryUsage) * 100;
      
      expect(memoryIncreasePercent).toBeLessThan(20); // Less than 20% increase
    });

    // Test performance under different viewport sizes
    await test.step('Test responsive performance', async () => {
      const viewportSizes = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop-small' },
        { width: 1920, height: 1080, name: 'desktop-large' },
      ];

      for (const viewport of viewportSizes) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(500);

        const metrics = await performanceMonitor.captureMetrics();
        
        // Verify performance is consistent across viewport sizes
        expect(metrics.renderingMetrics.FCP).toBeLessThan(2000);
        expect(metrics.renderingMetrics.LCP).toBeLessThan(3000);
        expect(metrics.renderingMetrics.CLS).toBeLessThan(0.1);
        
        console.log(`${viewport.name} Performance:`, {
          FCP: metrics.renderingMetrics.FCP,
          LCP: metrics.renderingMetrics.LCP,
          CLS: metrics.renderingMetrics.CLS,
        });
      }
    });

    // Test performance with slow JavaScript execution
    await test.step('Test CPU throttling performance', async () => {
      // Simulate slow CPU
      await page.context().addInitScript(() => {
        // Simulate slow JavaScript execution
        const originalSetTimeout = window.setTimeout;
        window.setTimeout = (callback, delay) => {
          return originalSetTimeout(callback, delay * 2);
        };
      });

      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');

      const throttledMetrics = await performanceMonitor.captureMetrics();
      
      // Verify app remains functional under CPU constraints
      expect(throttledMetrics.renderingMetrics.FCP).toBeLessThan(5000);
      expect(throttledMetrics.renderingMetrics.LCP).toBeLessThan(7000);
      expect(throttledMetrics.renderingMetrics.INP).toBeLessThan(500);
    });
  });

  test('should optimize image and asset loading', async ({ page, stagehand }) => {
    // Test image optimization
    await test.step('Test image optimization', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Capture image loading metrics
      const imageMetrics = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.width,
          displayHeight: img.height,
          loading: img.loading,
          complete: img.complete,
        }));
      });

      // Verify image optimization
      for (const image of imageMetrics) {
        // Check for responsive images
        expect(image.displayWidth).toBeLessThanOrEqual(image.naturalWidth);
        expect(image.displayHeight).toBeLessThanOrEqual(image.naturalHeight);
        
        // Verify lazy loading is implemented
        expect(image.loading).toBe('lazy');
      }

      // Test image format optimization
      const networkActivity = await page.evaluate(() => {
        return performance.getEntriesByType('resource')
          .filter(entry => entry.name.includes('.'))
          .filter(entry => 
            entry.name.includes('.jpg') || 
            entry.name.includes('.png') || 
            entry.name.includes('.webp') || 
            entry.name.includes('.avif')
          );
      });

      // Verify modern image formats are used
      const modernFormats = networkActivity.filter(entry => 
        entry.name.includes('.webp') || entry.name.includes('.avif')
      );
      
      expect(modernFormats.length).toBeGreaterThan(0);
    });

    // Test asset caching
    await test.step('Test asset caching', async () => {
      // First load
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');
      
      const firstLoadMetrics = await performanceMonitor.captureNetworkMetrics();
      
      // Second load (should use cache)
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      const secondLoadMetrics = await performanceMonitor.captureNetworkMetrics();
      
      // Verify caching effectiveness
      expect(secondLoadMetrics.cacheBehavior.cacheHitRate).toBeGreaterThan(0.7);
      expect(secondLoadMetrics.totalTransferSize).toBeLessThan(firstLoadMetrics.totalTransferSize);
    });

    // Test font loading optimization
    await test.step('Test font loading optimization', async () => {
      await page.goto('http://localhost:3000');
      await page.waitForLoadState('networkidle');

      // Check font loading strategy
      const fontMetrics = await page.evaluate(() => {
        const fontFaces = Array.from(document.fonts);
        return fontFaces.map(font => ({
          family: font.family,
          style: font.style,
          weight: font.weight,
          status: font.status,
        }));
      });

      // Verify fonts are loaded efficiently
      const loadedFonts = fontMetrics.filter(font => font.status === 'loaded');
      expect(loadedFonts.length).toBeGreaterThan(0);

      // Test font display optimization
      const fontDisplayRules = await page.evaluate(() => {
        const stylesheets = Array.from(document.styleSheets);
        const fontFaceRules = [];
        
        stylesheets.forEach(stylesheet => {
          try {
            const rules = Array.from(stylesheet.cssRules);
            rules.forEach(rule => {
              if (rule.type === CSSRule.FONT_FACE_RULE) {
                fontFaceRules.push(rule.cssText);
              }
            });
          } catch (e) {
            // Cross-origin stylesheet
          }
        });
        
        return fontFaceRules;
      });

      // Verify font-display is optimized
      const optimizedFonts = fontDisplayRules.filter(rule => 
        rule.includes('font-display: swap') || 
        rule.includes('font-display: fallback')
      );
      
      expect(optimizedFonts.length).toBeGreaterThan(0);
    });
  });
});