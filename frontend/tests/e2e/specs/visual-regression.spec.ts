import { test, expect } from '../fixtures/test-fixtures';
import { TestDataManager } from '../utils/test-data-manager';
import { VisualTester } from '../utils/visual-testing';
import { PerformanceMonitor } from '../utils/performance-monitor';

test.describe('Visual Regression E2E Tests', () => {
  let dataManager: TestDataManager;
  let visualTester: VisualTester;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page, stagehand }) => {
    // Initialize test utilities
    dataManager = new TestDataManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    visualTester = new VisualTester(page, performanceMonitor);

    // Initialize test data and utilities
    await dataManager.initialize();
    await performanceMonitor.startMonitoring();
    await visualTester.initialize();

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup
    await dataManager.cleanup();
    await performanceMonitor.stopMonitoring();
    await visualTester.cleanup();
  });

  test('should maintain visual consistency across all pages', async ({ page, stagehand }) => {
    // Create test session
    const session = await dataManager.createSession('visual-regression-test', [
      'page-snapshots',
      'component-snapshots',
      'responsive-design',
      'theme-consistency'
    ]);

    // Test all major pages
    await test.step('Test page visual consistency', async () => {
      const testPages = [
        { path: '/', name: 'homepage', description: 'Main landing page' },
        { path: '/agents', name: 'agents-page', description: 'Agent management page' },
        { path: '/projects', name: 'projects-page', description: 'Project overview page' },
        { path: '/settings', name: 'settings-page', description: 'User settings page' },
      ];

      for (const testPage of testPages) {
        await page.goto(`http://localhost:3000${testPage.path}`);
        await page.waitForLoadState('networkidle');
        
        // Wait for animations to complete
        await page.waitForTimeout(1000);
        
        // Capture and compare screenshot
        const screenshotResult = await visualTester.captureScreenshot(testPage.name, {
          fullPage: true,
          animations: 'disabled',
          caret: 'hide'
        });
        
        expect(screenshotResult.passed).toBe(true);
        
        // Test responsive design
        const viewports = [
          { width: 320, height: 568, name: 'mobile' },
          { width: 768, height: 1024, name: 'tablet' },
          { width: 1920, height: 1080, name: 'desktop' },
        ];

        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(500);
          
          const responsiveResult = await visualTester.captureScreenshot(
            `${testPage.name}-${viewport.name}`,
            {
              fullPage: true,
              animations: 'disabled',
              caret: 'hide'
            }
          );
          
          expect(responsiveResult.passed).toBe(true);
        }
      }
    });

    // Test component visual consistency
    await test.step('Test component visual consistency', async () => {
      // Navigate to agents page for component testing
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');

      // Test agent card components
      await test.step('Test agent card components', async () => {
        const agentCards = await page.locator('[data-testid="agent-card"]');
        const cardCount = await agentCards.count();
        
        if (cardCount > 0) {
          // Capture first agent card
          const cardResult = await visualTester.captureElement(
            agentCards.first(),
            'agent-card-default'
          );
          expect(cardResult.passed).toBe(true);
          
          // Test hover state
          await agentCards.first().hover();
          await page.waitForTimeout(300);
          
          const hoverResult = await visualTester.captureElement(
            agentCards.first(),
            'agent-card-hover'
          );
          expect(hoverResult.passed).toBe(true);
        }
      });

      // Test navigation components
      await test.step('Test navigation components', async () => {
        const navigation = await page.locator('[data-testid="navigation"]');
        if (await navigation.count() > 0) {
          const navResult = await visualTester.captureElement(
            navigation,
            'navigation-default'
          );
          expect(navResult.passed).toBe(true);
        }
      });

      // Test form components
      await test.step('Test form components', async () => {
        // Click create agent button to show form
        await stagehand.act('Click create agent button');
        await page.waitForSelector('[data-testid="create-agent-form"]');
        
        const formResult = await visualTester.captureElement(
          page.locator('[data-testid="create-agent-form"]'),
          'create-agent-form'
        );
        expect(formResult.passed).toBe(true);
        
        // Test form validation states
        await stagehand.act('Click submit button without filling form');
        await page.waitForTimeout(300);
        
        const errorResult = await visualTester.captureElement(
          page.locator('[data-testid="create-agent-form"]'),
          'create-agent-form-errors'
        );
        expect(errorResult.passed).toBe(true);
      });
    });

    // Test theme consistency
    await test.step('Test theme consistency', async () => {
      // Test light theme
      await page.goto('http://localhost:3000/settings');
      await page.waitForLoadState('networkidle');
      
      await stagehand.act('Switch to light theme');
      await page.waitForTimeout(1000);
      
      const lightThemeResult = await visualTester.captureScreenshot('settings-light-theme', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(lightThemeResult.passed).toBe(true);
      
      // Test dark theme
      await stagehand.act('Switch to dark theme');
      await page.waitForTimeout(1000);
      
      const darkThemeResult = await visualTester.captureScreenshot('settings-dark-theme', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(darkThemeResult.passed).toBe(true);
      
      // Test system theme
      await stagehand.act('Switch to system theme');
      await page.waitForTimeout(1000);
      
      const systemThemeResult = await visualTester.captureScreenshot('settings-system-theme', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(systemThemeResult.passed).toBe(true);
    });

    // Test loading states
    await test.step('Test loading states', async () => {
      // Simulate slow network to capture loading states
      await page.route('**/api/agents', route => {
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, data: [] })
          });
        }, 2000);
      });

      await page.goto('http://localhost:3000/agents');
      
      // Capture loading state
      const loadingResult = await visualTester.captureScreenshot('agents-loading-state', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(loadingResult.passed).toBe(true);
      
      // Wait for data to load
      await page.waitForLoadState('networkidle');
      
      // Capture loaded state
      const loadedResult = await visualTester.captureScreenshot('agents-loaded-state', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(loadedResult.passed).toBe(true);
    });

    // Test error states
    await test.step('Test error states', async () => {
      // Simulate API error
      await page.route('**/api/agents', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      // Capture error state
      const errorResult = await visualTester.captureScreenshot('agents-error-state', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(errorResult.passed).toBe(true);
    });

    // Test empty states
    await test.step('Test empty states', async () => {
      // Mock empty response
      await page.route('**/api/agents', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        });
      });

      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      // Capture empty state
      const emptyResult = await visualTester.captureScreenshot('agents-empty-state', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(emptyResult.passed).toBe(true);
    });

    // End test session
    await dataManager.endSession(session.id, 'completed');
  });

  test('should maintain visual consistency during user interactions', async ({ page, stagehand }) => {
    // Generate test data
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];

    // Test interaction states
    await test.step('Test authentication flow visuals', async () => {
      // Capture login form
      const loginFormResult = await visualTester.captureScreenshot('login-form', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(loginFormResult.passed).toBe(true);
      
      // Test form interaction states
      await stagehand.act('Click on email input field');
      await page.waitForTimeout(300);
      
      const emailFocusResult = await visualTester.captureScreenshot('login-form-email-focus', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(emailFocusResult.passed).toBe(true);
      
      // Enter email
      await stagehand.act(`Type email: ${testUser.email}`);
      await page.waitForTimeout(300);
      
      const emailFilledResult = await visualTester.captureScreenshot('login-form-email-filled', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(emailFilledResult.passed).toBe(true);
      
      // Test password field
      await stagehand.act('Click on password input field');
      await page.waitForTimeout(300);
      
      const passwordFocusResult = await visualTester.captureScreenshot('login-form-password-focus', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(passwordFocusResult.passed).toBe(true);
      
      // Complete login
      await stagehand.act(`Type password: ${testUser.password}`);
      await stagehand.act('Click login button');
      await page.waitForSelector('[data-testid="dashboard"]');
      
      const dashboardResult = await visualTester.captureScreenshot('dashboard-after-login', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(dashboardResult.passed).toBe(true);
    });

    // Test agent creation workflow visuals
    await test.step('Test agent creation workflow visuals', async () => {
      // Navigate to agents page
      await stagehand.act('Navigate to agents page');
      await page.waitForSelector('[data-testid="agents-page"]');
      
      const agentsPageResult = await visualTester.captureScreenshot('agents-page-authenticated', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(agentsPageResult.passed).toBe(true);
      
      // Click create agent button
      await stagehand.act('Click create agent button');
      await page.waitForSelector('[data-testid="create-agent-modal"]');
      
      const createModalResult = await visualTester.captureScreenshot('create-agent-modal', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(createModalResult.passed).toBe(true);
      
      // Fill form fields
      await stagehand.act('Fill agent name field with "Test Agent"');
      await stagehand.act('Select agent type "coder"');
      await stagehand.act('Fill agent description with "Test agent description"');
      await page.waitForTimeout(500);
      
      const filledFormResult = await visualTester.captureScreenshot('create-agent-form-filled', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(filledFormResult.passed).toBe(true);
      
      // Submit form
      await stagehand.act('Click create agent submit button');
      await page.waitForSelector('[data-testid="agent-created-success"]');
      
      const successResult = await visualTester.captureScreenshot('agent-created-success', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(successResult.passed).toBe(true);
    });

    // Test modal and overlay visuals
    await test.step('Test modal and overlay visuals', async () => {
      // Test confirmation modal
      await stagehand.act('Click delete agent button');
      await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
      
      const deleteModalResult = await visualTester.captureScreenshot('delete-confirmation-modal', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(deleteModalResult.passed).toBe(true);
      
      // Test modal backdrop
      const backdropResult = await visualTester.captureElement(
        page.locator('[data-testid="modal-backdrop"]'),
        'modal-backdrop'
      );
      expect(backdropResult.passed).toBe(true);
      
      // Cancel deletion
      await stagehand.act('Click cancel button');
      await page.waitForSelector('[data-testid="delete-confirmation-modal"]', { state: 'detached' });
    });

    // Test notification and toast visuals
    await test.step('Test notification visuals', async () => {
      // Trigger success notification
      await stagehand.act('Click save settings button');
      await page.waitForSelector('[data-testid="success-notification"]');
      
      const successNotificationResult = await visualTester.captureScreenshot('success-notification', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(successNotificationResult.passed).toBe(true);
      
      // Test error notification
      await page.route('**/api/settings', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Validation failed' })
        });
      });
      
      await stagehand.act('Click save settings button');
      await page.waitForSelector('[data-testid="error-notification"]');
      
      const errorNotificationResult = await visualTester.captureScreenshot('error-notification', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(errorNotificationResult.passed).toBe(true);
    });
  });

  test('should handle complex layout scenarios', async ({ page, stagehand }) => {
    // Test data-heavy layouts
    await test.step('Test data-heavy layouts', async () => {
      // Generate large dataset
      const largeDataset = await dataManager.generateAgents(100);
      
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      // Capture agents list with large dataset
      const largeDatasetResult = await visualTester.captureScreenshot('agents-large-dataset', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(largeDatasetResult.passed).toBe(true);
      
      // Test pagination visuals
      if (await page.locator('[data-testid="pagination"]').count() > 0) {
        const paginationResult = await visualTester.captureElement(
          page.locator('[data-testid="pagination"]'),
          'pagination-controls'
        );
        expect(paginationResult.passed).toBe(true);
      }
      
      // Test filtering visuals
      await stagehand.act('Open agent filters');
      await page.waitForSelector('[data-testid="agent-filters-dropdown"]');
      
      const filtersResult = await visualTester.captureScreenshot('agent-filters-open', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(filtersResult.passed).toBe(true);
    });

    // Test responsive behavior
    await test.step('Test responsive behavior', async () => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile-portrait' },
        { width: 568, height: 320, name: 'mobile-landscape' },
        { width: 768, height: 1024, name: 'tablet-portrait' },
        { width: 1024, height: 768, name: 'tablet-landscape' },
        { width: 1440, height: 900, name: 'desktop-medium' },
        { width: 1920, height: 1080, name: 'desktop-large' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // Test main navigation
        const navResult = await visualTester.captureElement(
          page.locator('[data-testid="main-navigation"]'),
          `navigation-${viewport.name}`
        );
        expect(navResult.passed).toBe(true);
        
        // Test content area
        const contentResult = await visualTester.captureElement(
          page.locator('[data-testid="main-content"]'),
          `content-${viewport.name}`
        );
        expect(contentResult.passed).toBe(true);
        
        // Test responsive tables
        if (await page.locator('[data-testid="agents-table"]').count() > 0) {
          const tableResult = await visualTester.captureElement(
            page.locator('[data-testid="agents-table"]'),
            `table-${viewport.name}`
          );
          expect(tableResult.passed).toBe(true);
        }
      }
    });

    // Test print styles
    await test.step('Test print styles', async () => {
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      // Emulate print media
      await page.emulateMedia({ media: 'print' });
      
      const printResult = await visualTester.captureScreenshot('agents-print-view', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(printResult.passed).toBe(true);
      
      // Reset to screen media
      await page.emulateMedia({ media: 'screen' });
    });

    // Test high contrast mode
    await test.step('Test high contrast mode', async () => {
      // Enable high contrast
      await page.emulateMedia({ 
        colorScheme: 'dark',
        reducedMotion: 'reduce'
      });
      
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            * {
              filter: contrast(150%);
            }
          }
        `
      });
      
      const highContrastResult = await visualTester.captureScreenshot('agents-high-contrast', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(highContrastResult.passed).toBe(true);
    });

    // Test reduced motion
    await test.step('Test reduced motion', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      const reducedMotionResult = await visualTester.captureScreenshot('agents-reduced-motion', {
        fullPage: true,
        animations: 'disabled'
      });
      expect(reducedMotionResult.passed).toBe(true);
    });
  });

  test('should generate visual regression reports', async ({ page, stagehand }) => {
    // Generate comprehensive visual regression report
    await test.step('Generate visual regression report', async () => {
      const reportData = await visualTester.generateReport();
      
      expect(reportData.totalTests).toBeGreaterThan(0);
      expect(reportData.passedTests).toBeGreaterThan(0);
      expect(reportData.failedTests).toBeLessThan(reportData.totalTests * 0.1); // Less than 10% failure rate
      
      // Verify report contains expected sections
      expect(reportData.sections).toContain('page-snapshots');
      expect(reportData.sections).toContain('component-snapshots');
      expect(reportData.sections).toContain('responsive-design');
      expect(reportData.sections).toContain('theme-consistency');
      
      // Log report summary
      console.log('Visual Regression Report Summary:', {
        totalTests: reportData.totalTests,
        passedTests: reportData.passedTests,
        failedTests: reportData.failedTests,
        passRate: (reportData.passedTests / reportData.totalTests * 100).toFixed(2) + '%'
      });
    });

    // Test baseline update capability
    await test.step('Test baseline update capability', async () => {
      const baselineUpdated = await visualTester.updateBaselines(['agents-page']);
      expect(baselineUpdated).toBe(true);
    });

    // Test diff generation
    await test.step('Test diff generation', async () => {
      const diffResult = await visualTester.generateDiff('agents-page', 'agents-page-modified');
      expect(diffResult.diffGenerated).toBe(true);
      expect(diffResult.diffPath).toBeDefined();
    });
  });
});