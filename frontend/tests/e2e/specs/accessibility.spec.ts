import { test, expect } from '../fixtures/test-fixtures';
import { TestDataManager } from '../utils/test-data-manager';
import { AccessibilityTester } from '../utils/accessibility-testing';
import { PerformanceMonitor } from '../utils/performance-monitor';

test.describe('Accessibility E2E Tests', () => {
  let dataManager: TestDataManager;
  let accessibilityTester: AccessibilityTester;
  let performanceMonitor: PerformanceMonitor;

  test.beforeEach(async ({ page, stagehand }) => {
    // Initialize test utilities
    dataManager = new TestDataManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    accessibilityTester = new AccessibilityTester(page, performanceMonitor);

    // Initialize test data and utilities
    await dataManager.initialize();
    await performanceMonitor.startMonitoring();
    await accessibilityTester.initialize();

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Generate accessibility report
    const accessibilityReport = await accessibilityTester.generateReport();
    console.log('Accessibility Report:', accessibilityReport);

    // Cleanup
    await dataManager.cleanup();
    await performanceMonitor.stopMonitoring();
    await accessibilityTester.cleanup();
  });

  test('should meet WCAG 2.1 AA accessibility standards', async ({ page, stagehand }) => {
    // Create test session
    const session = await dataManager.createSession('accessibility-test', [
      'wcag-compliance',
      'keyboard-navigation',
      'screen-reader-support',
      'color-contrast'
    ]);

    // Test all major pages for accessibility
    await test.step('Test WCAG compliance on all pages', async () => {
      const testPages = [
        { path: '/', name: 'homepage', description: 'Main landing page' },
        { path: '/agents', name: 'agents-page', description: 'Agent management page' },
        { path: '/projects', name: 'projects-page', description: 'Project overview page' },
        { path: '/settings', name: 'settings-page', description: 'User settings page' },
      ];

      for (const testPage of testPages) {
        await page.goto(`http://localhost:3000${testPage.path}`);
        await page.waitForLoadState('networkidle');
        
        // Wait for dynamic content to load
        await page.waitForTimeout(1000);
        
        // Run accessibility audit
        const auditResult = await accessibilityTester.runAudit(testPage.name);
        
        // Verify no critical accessibility violations
        expect(auditResult.violations.critical).toBe(0);
        expect(auditResult.violations.serious).toBeLessThan(5);
        expect(auditResult.violations.moderate).toBeLessThan(10);
        
        // Verify WCAG compliance
        expect(auditResult.compliance.wcag21aa).toBeGreaterThan(0.95); // 95% compliance
        expect(auditResult.compliance.wcag22aa).toBeGreaterThan(0.90); // 90% compliance
        
        // Check specific accessibility features
        expect(auditResult.features.altText).toBe(true);
        expect(auditResult.features.headingStructure).toBe(true);
        expect(auditResult.features.colorContrast).toBe(true);
        expect(auditResult.features.keyboardNavigation).toBe(true);
        expect(auditResult.features.focusManagement).toBe(true);
        
        console.log(`${testPage.name} Accessibility Score:`, auditResult.score);
      }
    });

    // Test keyboard navigation
    await test.step('Test keyboard navigation', async () => {
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');

      // Test tab navigation
      await test.step('Test tab navigation', async () => {
        // Start from the beginning
        await page.keyboard.press('Home');
        await page.waitForTimeout(100);
        
        // Navigate through focusable elements
        const focusableElements = await page.locator('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])').all();
        
        for (let i = 0; i < Math.min(focusableElements.length, 20); i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          // Verify focus is visible
          const focusedElement = await page.locator(':focus').first();
          const focusedElementExists = await focusedElement.count() > 0;
          expect(focusedElementExists).toBe(true);
          
          // Verify focus ring is visible
          const focusRingVisible = await accessibilityTester.isFocusRingVisible();
          expect(focusRingVisible).toBe(true);
        }
      });

      // Test arrow key navigation
      await test.step('Test arrow key navigation', async () => {
        // Navigate to agent list
        await stagehand.act('Focus on agent list');
        await page.waitForTimeout(300);
        
        // Test arrow key navigation in lists
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        const selectedItem = await page.locator('[aria-selected="true"]').first();
        const selectedItemExists = await selectedItem.count() > 0;
        expect(selectedItemExists).toBe(true);
        
        // Test arrow up navigation
        await page.keyboard.press('ArrowUp');
        await page.waitForTimeout(100);
        
        // Test home/end navigation
        await page.keyboard.press('Home');
        await page.waitForTimeout(100);
        
        await page.keyboard.press('End');
        await page.waitForTimeout(100);
      });

      // Test escape key functionality
      await test.step('Test escape key functionality', async () => {
        // Open modal/dropdown
        await stagehand.act('Click create agent button');
        await page.waitForSelector('[data-testid="create-agent-modal"]');
        
        // Close with escape key
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Verify modal is closed
        const modalClosed = await page.locator('[data-testid="create-agent-modal"]').count() === 0;
        expect(modalClosed).toBe(true);
      });

      // Test enter/space key activation
      await test.step('Test enter/space key activation', async () => {
        // Focus on a button
        await page.locator('button').first().focus();
        
        // Test space key activation
        await page.keyboard.press('Space');
        await page.waitForTimeout(300);
        
        // Test enter key activation
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      });
    });

    // Test screen reader support
    await test.step('Test screen reader support', async () => {
      // Test ARIA labels and descriptions
      await test.step('Test ARIA labels and descriptions', async () => {
        const ariaLabels = await page.locator('[aria-label]').all();
        for (const element of ariaLabels) {
          const ariaLabel = await element.getAttribute('aria-label');
          expect(ariaLabel).toBeTruthy();
          expect(ariaLabel.length).toBeGreaterThan(0);
        }
        
        const ariaDescriptions = await page.locator('[aria-describedby]').all();
        for (const element of ariaDescriptions) {
          const ariaDescribedBy = await element.getAttribute('aria-describedby');
          expect(ariaDescribedBy).toBeTruthy();
          
          // Verify description element exists
          const descriptionElement = await page.locator(`#${ariaDescribedBy}`).count();
          expect(descriptionElement).toBeGreaterThan(0);
        }
      });

      // Test landmark roles
      await test.step('Test landmark roles', async () => {
        const landmarks = [
          { role: 'banner', selector: '[role="banner"], header' },
          { role: 'main', selector: '[role="main"], main' },
          { role: 'navigation', selector: '[role="navigation"], nav' },
          { role: 'contentinfo', selector: '[role="contentinfo"], footer' },
        ];
        
        for (const landmark of landmarks) {
          const landmarkElements = await page.locator(landmark.selector).count();
          expect(landmarkElements).toBeGreaterThan(0);
        }
      });

      // Test heading structure
      await test.step('Test heading structure', async () => {
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        
        expect(headings.length).toBeGreaterThan(0);
        
        // Verify h1 exists and is unique
        const h1Elements = await page.locator('h1').count();
        expect(h1Elements).toBe(1);
        
        // Verify proper heading hierarchy
        const headingStructure = await accessibilityTester.validateHeadingStructure();
        expect(headingStructure.isValid).toBe(true);
        expect(headingStructure.violations).toHaveLength(0);
      });

      // Test form labels
      await test.step('Test form labels', async () => {
        // Navigate to a form
        await stagehand.act('Click create agent button');
        await page.waitForSelector('[data-testid="create-agent-form"]');
        
        const formInputs = await page.locator('input, select, textarea').all();
        
        for (const input of formInputs) {
          const inputId = await input.getAttribute('id');
          const ariaLabel = await input.getAttribute('aria-label');
          const ariaLabelledBy = await input.getAttribute('aria-labelledby');
          
          // Verify input has proper labeling
          const hasLabel = inputId && await page.locator(`label[for="${inputId}"]`).count() > 0;
          const hasAriaLabel = !!ariaLabel;
          const hasAriaLabelledBy = !!ariaLabelledBy;
          
          expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBe(true);
        }
      });

      // Test live regions
      await test.step('Test live regions', async () => {
        // Trigger a notification
        await stagehand.act('Click save button');
        await page.waitForTimeout(500);
        
        // Verify live region announcements
        const liveRegions = await page.locator('[aria-live], [role="status"], [role="alert"]').all();
        expect(liveRegions.length).toBeGreaterThan(0);
        
        // Test different live region types
        const politeRegions = await page.locator('[aria-live="polite"]').count();
        const assertiveRegions = await page.locator('[aria-live="assertive"]').count();
        const statusRegions = await page.locator('[role="status"]').count();
        const alertRegions = await page.locator('[role="alert"]').count();
        
        expect(politeRegions + assertiveRegions + statusRegions + alertRegions).toBeGreaterThan(0);
      });
    });

    // Test color contrast
    await test.step('Test color contrast', async () => {
      const contrastResults = await accessibilityTester.checkColorContrast();
      
      // Verify WCAG AA contrast ratios
      expect(contrastResults.aa.normal).toBeGreaterThan(0.95); // 95% pass rate
      expect(contrastResults.aa.large).toBeGreaterThan(0.98); // 98% pass rate
      
      // Verify WCAG AAA contrast ratios (aspirational)
      expect(contrastResults.aaa.normal).toBeGreaterThan(0.80); // 80% pass rate
      expect(contrastResults.aaa.large).toBeGreaterThan(0.90); // 90% pass rate
      
      // Test specific color combinations
      const criticalElements = [
        { selector: 'button', description: 'Button text contrast' },
        { selector: 'a', description: 'Link text contrast' },
        { selector: 'input', description: 'Input text contrast' },
        { selector: '[role="alert"]', description: 'Alert text contrast' },
      ];
      
      for (const element of criticalElements) {
        const elementContrast = await accessibilityTester.checkElementContrast(element.selector);
        expect(elementContrast.ratio).toBeGreaterThan(4.5); // WCAG AA standard
      }
    });

    // Test focus management
    await test.step('Test focus management', async () => {
      // Test modal focus trapping
      await test.step('Test modal focus trapping', async () => {
        await stagehand.act('Click create agent button');
        await page.waitForSelector('[data-testid="create-agent-modal"]');
        
        // Test that focus is trapped within modal
        const focusTrappingResult = await accessibilityTester.testFocusTrapping();
        expect(focusTrappingResult.isTrapped).toBe(true);
        expect(focusTrappingResult.escapedFocus).toBe(false);
        
        // Close modal
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Verify focus returns to trigger element
        const focusRestored = await accessibilityTester.isFocusRestored();
        expect(focusRestored).toBe(true);
      });

      // Test skip links
      await test.step('Test skip links', async () => {
        await page.goto('http://localhost:3000');
        await page.waitForLoadState('networkidle');
        
        // Test skip to main content
        await page.keyboard.press('Tab');
        const skipLink = await page.locator('a[href="#main"]').first();
        const skipLinkExists = await skipLink.count() > 0;
        
        if (skipLinkExists) {
          await skipLink.click();
          await page.waitForTimeout(300);
          
          // Verify focus moved to main content
          const mainFocused = await page.locator('main:focus, #main:focus').count() > 0;
          expect(mainFocused).toBe(true);
        }
      });

      // Test dropdown/menu focus management
      await test.step('Test dropdown focus management', async () => {
        // Open dropdown menu
        await stagehand.act('Click user menu button');
        await page.waitForSelector('[data-testid="user-menu"]');
        
        // Test arrow key navigation in menu
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(100);
        
        // Test escape to close menu
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        
        // Verify focus returns to menu button
        const menuButtonFocused = await page.locator('[data-testid="user-menu-button"]:focus').count() > 0;
        expect(menuButtonFocused).toBe(true);
      });
    });

    // Test error handling accessibility
    await test.step('Test error handling accessibility', async () => {
      // Test form validation errors
      await test.step('Test form validation errors', async () => {
        await stagehand.act('Click create agent button');
        await page.waitForSelector('[data-testid="create-agent-form"]');
        
        // Submit form without required fields
        await stagehand.act('Click submit button');
        await page.waitForTimeout(500);
        
        // Verify error messages are announced
        const errorMessages = await page.locator('[role="alert"], [aria-live="assertive"]').all();
        expect(errorMessages.length).toBeGreaterThan(0);
        
        // Verify error messages are associated with inputs
        const invalidInputs = await page.locator('[aria-invalid="true"]').all();
        expect(invalidInputs.length).toBeGreaterThan(0);
        
        for (const input of invalidInputs) {
          const ariaDescribedBy = await input.getAttribute('aria-describedby');
          expect(ariaDescribedBy).toBeTruthy();
          
          // Verify error message element exists
          const errorElement = await page.locator(`#${ariaDescribedBy}`).count();
          expect(errorElement).toBeGreaterThan(0);
        }
      });

      // Test loading states accessibility
      await test.step('Test loading states accessibility', async () => {
        // Mock slow API response
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
        
        // Verify loading state is announced
        const loadingRegions = await page.locator('[aria-live], [role="status"]').all();
        expect(loadingRegions.length).toBeGreaterThan(0);
        
        // Verify loading indicator is accessible
        const loadingIndicator = await page.locator('[aria-label*="loading"], [aria-label*="Loading"]').first();
        const loadingIndicatorExists = await loadingIndicator.count() > 0;
        expect(loadingIndicatorExists).toBe(true);
      });
    });

    // Test responsive accessibility
    await test.step('Test responsive accessibility', async () => {
      const viewports = [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1920, height: 1080, name: 'desktop' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.waitForTimeout(1000);
        
        // Test touch target sizes on mobile
        if (viewport.name === 'mobile') {
          const touchTargets = await page.locator('button, a, input, select').all();
          
          for (const target of touchTargets.slice(0, 10)) { // Test first 10 elements
            const boundingBox = await target.boundingBox();
            if (boundingBox) {
              // WCAG recommends minimum 44x44 pixels
              expect(boundingBox.width).toBeGreaterThan(44);
              expect(boundingBox.height).toBeGreaterThan(44);
            }
          }
        }
        
        // Test keyboard navigation still works
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
        
        const focusedElement = await page.locator(':focus').first();
        const focusedElementExists = await focusedElement.count() > 0;
        expect(focusedElementExists).toBe(true);
      }
    });

    // End test session
    await dataManager.endSession(session.id, 'completed');
    
    // Generate final accessibility report
    const finalReport = await accessibilityTester.generateReport();
    expect(finalReport.overallScore).toBeGreaterThan(0.90); // 90% overall score
    
    // Verify specific accessibility metrics
    expect(finalReport.wcagCompliance.aa).toBeGreaterThan(0.95); // 95% AA compliance
    expect(finalReport.keyboardNavigation.score).toBeGreaterThan(0.90); // 90% keyboard nav
    expect(finalReport.screenReaderSupport.score).toBeGreaterThan(0.90); // 90% screen reader
    expect(finalReport.colorContrast.score).toBeGreaterThan(0.95); // 95% color contrast
  });

  test('should support assistive technologies', async ({ page, stagehand }) => {
    // Test screen reader compatibility
    await test.step('Test screen reader compatibility', async () => {
      // Generate test user
      const testUsers = await dataManager.generateUsers(1);
      const testUser = testUsers[0];
      
      // Test login flow with screen reader
      await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
      await page.waitForSelector('[data-testid="dashboard"]');
      
      // Verify screen reader announcements
      const screenReaderContent = await accessibilityTester.getScreenReaderContent();
      expect(screenReaderContent.announcements.length).toBeGreaterThan(0);
      expect(screenReaderContent.structure.headings.length).toBeGreaterThan(0);
      expect(screenReaderContent.structure.landmarks.length).toBeGreaterThan(0);
    });

    // Test voice control compatibility
    await test.step('Test voice control compatibility', async () => {
      // Test voice commands simulation
      const voiceCommands = [
        { command: 'Click create agent button', target: '[data-testid="create-agent-button"]' },
        { command: 'Click cancel button', target: '[data-testid="cancel-button"]' },
        { command: 'Click settings link', target: '[data-testid="settings-link"]' },
      ];
      
      for (const voiceCommand of voiceCommands) {
        const element = await page.locator(voiceCommand.target).first();
        const elementExists = await element.count() > 0;
        
        if (elementExists) {
          // Verify element is voice-controllable
          const isVoiceControllable = await accessibilityTester.isVoiceControllable(voiceCommand.target);
          expect(isVoiceControllable).toBe(true);
        }
      }
    });

    // Test high contrast mode
    await test.step('Test high contrast mode', async () => {
      // Enable high contrast mode
      await page.emulateMedia({ 
        colorScheme: 'dark',
        reducedMotion: 'reduce' 
      });
      
      await page.addStyleTag({
        content: `
          @media (prefers-contrast: high) {
            :root {
              --contrast-ratio: 7;
            }
          }
        `
      });
      
      // Test high contrast accessibility
      const highContrastResult = await accessibilityTester.runAudit('high-contrast-mode');
      expect(highContrastResult.violations.critical).toBe(0);
      expect(highContrastResult.features.colorContrast).toBe(true);
    });

    // Test reduced motion preferences
    await test.step('Test reduced motion preferences', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      // Verify animations are disabled/reduced
      const reducedMotionSupport = await accessibilityTester.checkReducedMotionSupport();
      expect(reducedMotionSupport.isSupported).toBe(true);
      expect(reducedMotionSupport.violatingAnimations).toHaveLength(0);
    });

    // Test zoom compatibility
    await test.step('Test zoom compatibility', async () => {
      // Test 200% zoom
      await page.setViewportSize({ width: 640, height: 480 }); // Simulate 200% zoom
      
      // Verify content is still accessible
      const zoomAccessibility = await accessibilityTester.runAudit('zoom-200-percent');
      expect(zoomAccessibility.violations.critical).toBe(0);
      expect(zoomAccessibility.features.keyboardNavigation).toBe(true);
      
      // Test horizontal scrolling (should not be required)
      const horizontalScrollRequired = await accessibilityTester.requiresHorizontalScroll();
      expect(horizontalScrollRequired).toBe(false);
    });
  });

  test('should handle accessibility in dynamic content', async ({ page, stagehand }) => {
    // Test dynamic content announcements
    await test.step('Test dynamic content announcements', async () => {
      // Generate test agents
      const testAgents = await dataManager.generateAgents(10);
      
      await page.goto('http://localhost:3000/agents');
      await page.waitForLoadState('networkidle');
      
      // Test status updates
      await test.step('Test status updates', async () => {
        // Simulate agent status change
        await dataManager.updateAgentStatus(testAgents[0].id, 'busy');
        await page.waitForTimeout(500);
        
        // Verify status change is announced
        const statusAnnouncements = await page.locator('[aria-live], [role="status"]').all();
        expect(statusAnnouncements.length).toBeGreaterThan(0);
      });
      
      // Test search results
      await test.step('Test search results', async () => {
        await stagehand.act('Click search input');
        await stagehand.act('Type "test agent"');
        await page.waitForTimeout(1000);
        
        // Verify search results are announced
        const searchResults = await page.locator('[role="listbox"], [aria-live]').all();
        expect(searchResults.length).toBeGreaterThan(0);
        
        // Verify result count is announced
        const resultCount = await page.locator('[aria-live*="result"], [aria-label*="result"]').count();
        expect(resultCount).toBeGreaterThan(0);
      });
      
      // Test infinite scroll accessibility
      await test.step('Test infinite scroll accessibility', async () => {
        // Generate more test data
        const moreAgents = await dataManager.generateAgents(50);
        
        // Scroll to bottom
        await page.keyboard.press('End');
        await page.waitForTimeout(1000);
        
        // Verify new content is announced
        const newContentAnnouncements = await page.locator('[aria-live="polite"]').all();
        expect(newContentAnnouncements.length).toBeGreaterThan(0);
      });
    });

    // Test modal accessibility
    await test.step('Test modal accessibility', async () => {
      // Open modal
      await stagehand.act('Click create agent button');
      await page.waitForSelector('[data-testid="create-agent-modal"]');
      
      // Verify modal accessibility
      const modalAccessibility = await accessibilityTester.testModalAccessibility();
      expect(modalAccessibility.hasAriaModal).toBe(true);
      expect(modalAccessibility.hasAriaLabel).toBe(true);
      expect(modalAccessibility.focusTrapped).toBe(true);
      expect(modalAccessibility.backgroundInert).toBe(true);
      
      // Test modal close accessibility
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      
      // Verify focus restoration
      const focusRestored = await accessibilityTester.isFocusRestored();
      expect(focusRestored).toBe(true);
    });

    // Test data table accessibility
    await test.step('Test data table accessibility', async () => {
      // Check if data table exists
      const dataTable = await page.locator('[role="table"], table').first();
      const tableExists = await dataTable.count() > 0;
      
      if (tableExists) {
        const tableAccessibility = await accessibilityTester.testTableAccessibility();
        expect(tableAccessibility.hasCaption).toBe(true);
        expect(tableAccessibility.hasHeaders).toBe(true);
        expect(tableAccessibility.hasScope).toBe(true);
        expect(tableAccessibility.hasAriaSort).toBe(true);
      }
    });

    // Test form accessibility
    await test.step('Test form accessibility', async () => {
      await stagehand.act('Click create agent button');
      await page.waitForSelector('[data-testid="create-agent-form"]');
      
      const formAccessibility = await accessibilityTester.testFormAccessibility();
      expect(formAccessibility.hasFieldsets).toBe(true);
      expect(formAccessibility.hasLabels).toBe(true);
      expect(formAccessibility.hasErrorMessages).toBe(true);
      expect(formAccessibility.hasRequiredIndicators).toBe(true);
    });
  });

  test('should generate comprehensive accessibility reports', async ({ page, stagehand }) => {
    // Generate comprehensive accessibility report
    await test.step('Generate comprehensive accessibility report', async () => {
      const reportData = await accessibilityTester.generateComprehensiveReport();
      
      expect(reportData.totalTests).toBeGreaterThan(0);
      expect(reportData.passedTests).toBeGreaterThan(0);
      expect(reportData.failedTests).toBeLessThan(reportData.totalTests * 0.05); // Less than 5% failure rate
      
      // Verify report contains expected sections
      expect(reportData.sections).toContain('wcag-compliance');
      expect(reportData.sections).toContain('keyboard-navigation');
      expect(reportData.sections).toContain('screen-reader-support');
      expect(reportData.sections).toContain('color-contrast');
      expect(reportData.sections).toContain('focus-management');
      expect(reportData.sections).toContain('assistive-technology');
      
      // Verify detailed metrics
      expect(reportData.wcagCompliance.aa).toBeGreaterThan(0.95);
      expect(reportData.wcagCompliance.aaa).toBeGreaterThan(0.80);
      expect(reportData.keyboardNavigation.score).toBeGreaterThan(0.90);
      expect(reportData.screenReaderSupport.score).toBeGreaterThan(0.90);
      expect(reportData.colorContrast.score).toBeGreaterThan(0.95);
      
      // Log comprehensive report summary
      console.log('Comprehensive Accessibility Report:', {
        totalTests: reportData.totalTests,
        passedTests: reportData.passedTests,
        failedTests: reportData.failedTests,
        wcagAACompliance: (reportData.wcagCompliance.aa * 100).toFixed(1) + '%',
        wcagAAACompliance: (reportData.wcagCompliance.aaa * 100).toFixed(1) + '%',
        keyboardNavScore: (reportData.keyboardNavigation.score * 100).toFixed(1) + '%',
        screenReaderScore: (reportData.screenReaderSupport.score * 100).toFixed(1) + '%',
        colorContrastScore: (reportData.colorContrast.score * 100).toFixed(1) + '%'
      });
    });

    // Test accessibility regression detection
    await test.step('Test accessibility regression detection', async () => {
      const regressionResults = await accessibilityTester.detectRegressions();
      expect(regressionResults.hasRegressions).toBe(false);
      expect(regressionResults.newViolations).toHaveLength(0);
      expect(regressionResults.improvedViolations).toBeGreaterThanOrEqual(0);
    });

    // Test accessibility monitoring
    await test.step('Test accessibility monitoring', async () => {
      const monitoringResults = await accessibilityTester.setupMonitoring();
      expect(monitoringResults.isActive).toBe(true);
      expect(monitoringResults.checkInterval).toBeLessThan(60000); // Less than 1 minute
      expect(monitoringResults.alertThreshold).toBeLessThan(0.1); // Less than 10% failure rate
    });
  });
});