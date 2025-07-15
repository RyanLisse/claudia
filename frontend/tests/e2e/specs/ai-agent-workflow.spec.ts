import { test, expect } from '../fixtures/test-fixtures';
import { TestDataManager } from '../utils/test-data-manager';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { VisualTester } from '../utils/visual-testing';
import { AccessibilityTester } from '../utils/accessibility-testing';

test.describe('AI Agent Workflow E2E Tests', () => {
  let dataManager: TestDataManager;
  let performanceMonitor: PerformanceMonitor;
  let visualTester: VisualTester;
  let accessibilityTester: AccessibilityTester;

  test.beforeEach(async ({ page, stagehand }) => {
    // Initialize test utilities
    dataManager = new TestDataManager(page);
    performanceMonitor = new PerformanceMonitor(page);
    visualTester = new VisualTester(page, performanceMonitor);
    accessibilityTester = new AccessibilityTester(page);

    // Initialize test data and utilities
    await dataManager.initialize();
    await performanceMonitor.startMonitoring();
    await accessibilityTester.initialize();

    // Navigate to the application
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async ({ page }) => {
    // Generate test reports
    const performanceReport = await performanceMonitor.generateReport();
    const visualReport = await visualTester.generateVisualReport();
    const accessibilityReport = await accessibilityTester.generateReport();

    // Log reports for CI/CD
    console.log('Performance Report:', performanceReport);
    console.log('Visual Report:', visualReport);
    console.log('Accessibility Report:', accessibilityReport);

    // Cleanup
    await dataManager.cleanup();
    await performanceMonitor.stopMonitoring();
  });

  test('should complete full agent creation and management workflow', async ({ page, stagehand }) => {
    // Create test session
    const session = await dataManager.createSession('agent-workflow-test', [
      'agent-creation',
      'agent-management',
      'agent-communication'
    ]);

    // Generate test data
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];
    const testProjects = await dataManager.generateProjects(1, testUser.id);
    const testProject = testProjects[0];

    // Step 1: User Authentication
    await test.step('Authenticate user', async () => {
      await stagehand.act('Click on the login button');
      await stagehand.act(`Enter email: ${testUser.email}`);
      await stagehand.act(`Enter password: ${testUser.password}`);
      await stagehand.act('Click login submit button');
      
      // Wait for authentication to complete
      await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
      
      // Verify authentication success
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
      
      // Capture performance metrics
      const authMetrics = await performanceMonitor.captureMetrics();
      expect(authMetrics.navigationTiming.loadComplete).toBeLessThan(3000);
    });

    // Step 2: Navigate to Agents Page
    await test.step('Navigate to agents page', async () => {
      await stagehand.act('Click on the agents navigation menu item');
      await page.waitForSelector('[data-testid="agents-page"]', { timeout: 5000 });
      
      // Verify page loaded correctly
      await expect(page.locator('[data-testid="agents-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="create-agent-button"]')).toBeVisible();
      
      // Test accessibility
      const accessibilityResult = await accessibilityTester.testPage('agents-page');
      expect(accessibilityResult.violations.length).toBe(0);
      
      // Visual regression test
      const visualResult = await visualTester.compareScreenshot('agents-page-initial');
      expect(visualResult.passed).toBe(true);
    });

    // Step 3: Create New Agent
    await test.step('Create new agent', async () => {
      await stagehand.act('Click on the create new agent button');
      await page.waitForSelector('[data-testid="agent-creation-modal"]', { timeout: 5000 });
      
      // Fill in agent details
      const agentData = {
        name: 'Test Code Agent',
        type: 'coder',
        capabilities: ['code_generation', 'debugging', 'testing'],
        maxTasks: 5,
        timeout: 30000,
      };

      await stagehand.act(`Enter agent name: ${agentData.name}`);
      await stagehand.act(`Select agent type: ${agentData.type}`);
      await stagehand.act(`Set max concurrent tasks: ${agentData.maxTasks}`);
      await stagehand.act(`Set timeout: ${agentData.timeout}`);
      
      // Add capabilities
      for (const capability of agentData.capabilities) {
        await stagehand.act(`Select capability: ${capability}`);
      }
      
      // Submit form
      await stagehand.act('Click create agent button');
      
      // Wait for agent creation success
      await page.waitForSelector('[data-testid="agent-created-success"]', { timeout: 10000 });
      
      // Verify agent appears in list
      await expect(page.locator(`[data-testid="agent-card-${agentData.name}"]`)).toBeVisible();
      
      // Test form accessibility
      const formAccessibility = await accessibilityTester.testElement(
        '[data-testid="agent-creation-form"]',
        'agent-creation-form'
      );
      expect(formAccessibility.violations.length).toBe(0);
    });

    // Step 4: Test Agent Communication
    await test.step('Test agent communication', async () => {
      const testAgents = await dataManager.generateAgents(3, testProject.id);
      const messages = await dataManager.generateMessages(10);
      
      // Click on agent to open details
      await stagehand.act('Click on the first agent card');
      await page.waitForSelector('[data-testid="agent-details-panel"]', { timeout: 5000 });
      
      // Test sending message to agent
      await stagehand.act('Click on send message button');
      await stagehand.act('Enter message: "Execute code generation task"');
      await stagehand.act('Click send message');
      
      // Wait for message to be sent
      await page.waitForSelector('[data-testid="message-sent-indicator"]', { timeout: 5000 });
      
      // Verify message appears in conversation
      await expect(page.locator('[data-testid="conversation-message"]')).toBeVisible();
      
      // Test real-time updates
      await dataManager.updateAgentStatus(testAgents[0].id, 'busy');
      await page.waitForSelector('[data-testid="agent-status-busy"]', { timeout: 3000 });
      
      // Verify status update
      await expect(page.locator('[data-testid="agent-status-busy"]')).toBeVisible();
    });

    // Step 5: Test Agent Metrics and Monitoring
    await test.step('Test agent metrics and monitoring', async () => {
      // Navigate to metrics tab
      await stagehand.act('Click on agent metrics tab');
      await page.waitForSelector('[data-testid="agent-metrics-panel"]', { timeout: 5000 });
      
      // Verify metrics are displayed
      await expect(page.locator('[data-testid="agent-uptime-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-throughput-metric"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-error-rate-metric"]')).toBeVisible();
      
      // Test responsive design
      await page.setViewportSize({ width: 768, height: 1024 });
      const mobileVisual = await visualTester.compareScreenshot('agent-metrics-mobile');
      expect(mobileVisual.passed).toBe(true);
      
      // Test desktop view
      await page.setViewportSize({ width: 1920, height: 1080 });
      const desktopVisual = await visualTester.compareScreenshot('agent-metrics-desktop');
      expect(desktopVisual.passed).toBe(true);
    });

    // Step 6: Test Agent Workflow Coordination
    await test.step('Test agent workflow coordination', async () => {
      // Create workflow scenario
      const workflowScenario = await dataManager.createAgentWorkflowScenario();
      
      // Navigate to workflow management
      await stagehand.act('Click on workflow management tab');
      await page.waitForSelector('[data-testid="workflow-management-panel"]', { timeout: 5000 });
      
      // Create new workflow
      await stagehand.act('Click create workflow button');
      await stagehand.act('Enter workflow name: "Test Code Generation Pipeline"');
      await stagehand.act('Select coordinator agent');
      
      // Add worker agents
      for (const worker of workflowScenario.workers) {
        await stagehand.act(`Add worker agent: ${worker.name}`);
      }
      
      // Configure workflow steps
      await stagehand.act('Add workflow step: "Analyze requirements"');
      await stagehand.act('Add workflow step: "Generate code"');
      await stagehand.act('Add workflow step: "Run tests"');
      await stagehand.act('Add workflow step: "Review and finalize"');
      
      // Start workflow
      await stagehand.act('Click start workflow button');
      
      // Wait for workflow to initialize
      await page.waitForSelector('[data-testid="workflow-running-indicator"]', { timeout: 10000 });
      
      // Verify workflow is running
      await expect(page.locator('[data-testid="workflow-status-running"]')).toBeVisible();
      
      // Monitor workflow progress
      await page.waitForTimeout(5000); // Allow workflow to progress
      
      // Check workflow metrics
      const workflowMetrics = await performanceMonitor.captureMetrics();
      expect(workflowMetrics.memoryUsage).toBeLessThan(500 * 1024 * 1024); // 500MB
    });

    // Step 7: Test Error Handling and Recovery
    await test.step('Test error handling and recovery', async () => {
      // Create error scenario
      const errorScenario = await dataManager.createErrorHandlingScenario();
      
      // Simulate agent failure
      await dataManager.updateAgentStatus(errorScenario.failingAgents[0].id, 'error');
      
      // Verify error is displayed
      await page.waitForSelector('[data-testid="agent-error-indicator"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="agent-error-indicator"]')).toBeVisible();
      
      // Test error recovery
      await stagehand.act('Click on retry agent button');
      await page.waitForSelector('[data-testid="agent-retry-initiated"]', { timeout: 3000 });
      
      // Update agent status to recovered
      await dataManager.updateAgentStatus(errorScenario.failingAgents[0].id, 'idle');
      
      // Verify recovery
      await page.waitForSelector('[data-testid="agent-status-idle"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="agent-status-idle"]')).toBeVisible();
    });

    // Step 8: Test Performance Under Load
    await test.step('Test performance under load', async () => {
      // Generate load scenario
      const loadTestAgents = await dataManager.generateAgents(20, testProject.id);
      const loadTestMessages = await dataManager.generateMessages(100);
      
      // Simulate high activity
      for (let i = 0; i < 10; i++) {
        await dataManager.updateAgentStatus(loadTestAgents[i].id, 'busy');
      }
      
      // Monitor performance during load
      const loadMetrics = await performanceMonitor.captureMetrics();
      
      // Verify performance remains acceptable
      expect(loadMetrics.renderingMetrics.FCP).toBeLessThan(2000);
      expect(loadMetrics.renderingMetrics.LCP).toBeLessThan(4000);
      expect(loadMetrics.renderingMetrics.CLS).toBeLessThan(0.1);
      
      // Test UI responsiveness
      await stagehand.act('Click on agent list refresh button');
      const refreshStartTime = Date.now();
      await page.waitForSelector('[data-testid="agent-list-updated"]', { timeout: 5000 });
      const refreshEndTime = Date.now();
      
      expect(refreshEndTime - refreshStartTime).toBeLessThan(3000);
    });

    // Step 9: Test Data Persistence and Sync
    await test.step('Test data persistence and sync', async () => {
      // Create data snapshot
      const snapshot = await dataManager.createSnapshot('pre-sync-test', 'Before sync test');
      
      // Refresh page to test persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Verify data persisted
      await expect(page.locator('[data-testid="agents-page"]')).toBeVisible();
      await expect(page.locator('[data-testid="agent-card"]')).toHaveCount(1); // At least one agent
      
      // Test real-time sync
      await dataManager.updateProjectMetrics(testProject.id, {
        totalAgents: 25,
        activeAgents: 20,
        totalTasks: 150,
        completedTasks: 120,
      });
      
      // Verify metrics updated in UI
      await page.waitForSelector('[data-testid="project-metrics-updated"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="total-agents-count"]')).toContainText('25');
    });

    // Step 10: Test Accessibility and Keyboard Navigation
    await test.step('Test accessibility and keyboard navigation', async () => {
      // Test keyboard navigation
      await page.keyboard.press('Tab'); // Focus first element
      await page.keyboard.press('Tab'); // Focus second element
      await page.keyboard.press('Enter'); // Activate focused element
      
      // Test keyboard shortcuts
      await page.keyboard.press('Control+k'); // Open command palette
      await page.waitForSelector('[data-testid="command-palette"]', { timeout: 3000 });
      
      // Test screen reader compatibility
      const ariaLabels = await page.locator('[aria-label]').count();
      expect(ariaLabels).toBeGreaterThan(0);
      
      // Test color contrast
      const contrastResults = await accessibilityTester.testColorContrast('agent-dashboard');
      expect(contrastResults.passed).toBe(true);
      
      // Test keyboard navigation in forms
      await stagehand.act('Click create agent button');
      await page.waitForSelector('[data-testid="agent-creation-form"]');
      
      const keyboardNavResults = await accessibilityTester.testKeyboardNavigation('agent-creation-form');
      expect(keyboardNavResults.passed).toBe(true);
    });

    // End test session
    await dataManager.endSession(session.id, 'completed');
    
    // Generate final performance report
    const finalReport = await performanceMonitor.generateReport();
    expect(finalReport.overallScore).toBeGreaterThan(0.8);
  });

  test('should handle agent communication failures gracefully', async ({ page, stagehand }) => {
    // Setup test data
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];
    const errorScenario = await dataManager.createErrorHandlingScenario();

    // Authenticate and navigate
    await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
    await page.waitForSelector('[data-testid="dashboard"]');
    
    await stagehand.act('Navigate to agents page');
    await page.waitForSelector('[data-testid="agents-page"]');

    // Test communication failure handling
    await test.step('Test message sending failure', async () => {
      // Click on failing agent
      await stagehand.act('Click on the first failing agent');
      await page.waitForSelector('[data-testid="agent-details-panel"]');
      
      // Try to send message to failing agent
      await stagehand.act('Click send message button');
      await stagehand.act('Enter message: "Test message to failing agent"');
      await stagehand.act('Click send message');
      
      // Wait for error notification
      await page.waitForSelector('[data-testid="message-send-error"]', { timeout: 5000 });
      
      // Verify error is displayed
      await expect(page.locator('[data-testid="message-send-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="message-send-error"]')).toContainText('Failed to send message');
      
      // Test retry functionality
      await stagehand.act('Click retry message button');
      await page.waitForSelector('[data-testid="message-retry-initiated"]', { timeout: 3000 });
    });

    // Test connection recovery
    await test.step('Test connection recovery', async () => {
      // Update agent status to recovered
      await dataManager.updateAgentStatus(errorScenario.failingAgents[0].id, 'idle');
      
      // Verify recovery notification
      await page.waitForSelector('[data-testid="agent-recovered-notification"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="agent-recovered-notification"]')).toBeVisible();
      
      // Test that messaging works after recovery
      await stagehand.act('Click send message button');
      await stagehand.act('Enter message: "Test message after recovery"');
      await stagehand.act('Click send message');
      
      // Verify message sent successfully
      await page.waitForSelector('[data-testid="message-sent-success"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="message-sent-success"]')).toBeVisible();
    });
  });

  test('should maintain performance under high agent load', async ({ page, stagehand }) => {
    // Create large-scale test scenario
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];
    const loadTestAgents = await dataManager.generateAgents(50);
    const loadTestMessages = await dataManager.generateMessages(200);

    // Authenticate and navigate
    await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
    await page.waitForSelector('[data-testid="dashboard"]');
    
    await stagehand.act('Navigate to agents page');
    await page.waitForSelector('[data-testid="agents-page"]');

    // Test performance under load
    await test.step('Monitor performance with many agents', async () => {
      // Simulate high activity
      for (let i = 0; i < 25; i++) {
        await dataManager.updateAgentStatus(loadTestAgents[i].id, 'busy');
      }
      
      // Monitor initial metrics
      const initialMetrics = await performanceMonitor.captureMetrics();
      
      // Perform UI operations
      await stagehand.act('Click on agent list refresh button');
      await page.waitForSelector('[data-testid="agent-list-updated"]');
      
      // Monitor metrics after operations
      const finalMetrics = await performanceMonitor.captureMetrics();
      
      // Verify performance remains acceptable
      expect(finalMetrics.renderingMetrics.FCP).toBeLessThan(3000);
      expect(finalMetrics.renderingMetrics.LCP).toBeLessThan(5000);
      expect(finalMetrics.memoryUsage).toBeLessThan(1000 * 1024 * 1024); // 1GB
      
      // Test scrolling performance with many agents
      await page.mouse.wheel(0, 1000);
      await page.waitForTimeout(1000);
      
      const scrollMetrics = await performanceMonitor.captureMetrics();
      expect(scrollMetrics.renderingMetrics.CLS).toBeLessThan(0.2);
    });

    // Test UI responsiveness
    await test.step('Test UI responsiveness under load', async () => {
      // Click on various UI elements
      const startTime = Date.now();
      
      await stagehand.act('Click on agent filters dropdown');
      await page.waitForSelector('[data-testid="agent-filters-menu"]');
      
      await stagehand.act('Select filter: Active agents only');
      await page.waitForSelector('[data-testid="filter-applied"]');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Verify responsive interaction
      expect(responseTime).toBeLessThan(2000);
      
      // Test that filtering works correctly
      const activeAgentCount = await page.locator('[data-testid="agent-card"]').count();
      expect(activeAgentCount).toBeLessThan(50); // Should be filtered
    });
  });

  test('should support comprehensive accessibility features', async ({ page, stagehand }) => {
    // Setup test data
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];
    testUser.preferences.accessibility = {
      reducedMotion: true,
      highContrast: true,
      screenReader: true,
    };

    // Authenticate and navigate
    await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
    await page.waitForSelector('[data-testid="dashboard"]');
    
    await stagehand.act('Navigate to agents page');
    await page.waitForSelector('[data-testid="agents-page"]');

    // Test comprehensive accessibility
    await test.step('Test full accessibility compliance', async () => {
      // Run full accessibility audit
      const fullAudit = await accessibilityTester.testPage('agents-page-full-audit', {
        includeTags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'focus-management': { enabled: true },
          'aria-labels': { enabled: true },
          'semantic-markup': { enabled: true },
        },
      });
      
      // Verify no accessibility violations
      expect(fullAudit.violations.length).toBe(0);
      expect(fullAudit.score).toBeGreaterThan(0.95);
    });

    // Test keyboard navigation
    await test.step('Test comprehensive keyboard navigation', async () => {
      const keyboardResults = await accessibilityTester.testKeyboardNavigation('agents-page-keyboard', {
        testTabNavigation: true,
        testArrowKeys: true,
        testEnterKey: true,
        testEscapeKey: true,
        testSpaceKey: true,
        testShortcuts: true,
      });
      
      expect(keyboardResults.passed).toBe(true);
      expect(keyboardResults.score).toBeGreaterThan(0.9);
    });

    // Test screen reader compatibility
    await test.step('Test screen reader compatibility', async () => {
      const ariaResults = await accessibilityTester.testAriaAttributes('agents-page-aria', {
        checkLabels: true,
        checkDescriptions: true,
        checkRoles: true,
        checkStates: true,
        checkProperties: true,
      });
      
      expect(ariaResults.passed).toBe(true);
      expect(ariaResults.missingLabels.length).toBe(0);
      expect(ariaResults.invalidRoles.length).toBe(0);
    });

    // Test color contrast
    await test.step('Test color contrast compliance', async () => {
      const contrastResults = await accessibilityTester.testColorContrast('agents-page-contrast', {
        checkAAA: true,
        checkLargeText: true,
        checkGraphics: true,
        checkFocus: true,
        checkHover: true,
      });
      
      expect(contrastResults.passed).toBe(true);
      expect(contrastResults.failedElements.length).toBe(0);
    });
  });

  test('should handle complex multi-agent scenarios', async ({ page, stagehand }) => {
    // Create complex workflow scenario
    const testUsers = await dataManager.generateUsers(1);
    const testUser = testUsers[0];
    const workflowScenario = await dataManager.createAgentWorkflowScenario();

    // Authenticate and navigate
    await stagehand.act(`Login with email: ${testUser.email} and password: ${testUser.password}`);
    await page.waitForSelector('[data-testid="dashboard"]');
    
    await stagehand.act('Navigate to agents page');
    await page.waitForSelector('[data-testid="agents-page"]');

    // Test complex multi-agent coordination
    await test.step('Test multi-agent task coordination', async () => {
      // Create a complex task that requires multiple agents
      await stagehand.act('Click create complex task button');
      await page.waitForSelector('[data-testid="complex-task-modal"]');
      
      await stagehand.act('Enter task name: "Full-stack development pipeline"');
      await stagehand.act('Enter task description: "Complete development workflow from requirements to deployment"');
      
      // Assign multiple agents to different phases
      await stagehand.act('Assign analyst agent to requirements phase');
      await stagehand.act('Assign coder agent to development phase');
      await stagehand.act('Assign tester agent to testing phase');
      await stagehand.act('Assign coordinator agent to orchestration');
      
      // Start the complex task
      await stagehand.act('Click start complex task button');
      await page.waitForSelector('[data-testid="complex-task-started"]');
      
      // Monitor multi-agent coordination
      await page.waitForSelector('[data-testid="multi-agent-coordination-active"]', { timeout: 10000 });
      
      // Verify all agents are coordinating
      await expect(page.locator('[data-testid="agent-coordination-status"]')).toContainText('4 agents coordinating');
    });

    // Test task handoff between agents
    await test.step('Test task handoff between agents', async () => {
      // Wait for first phase completion
      await page.waitForSelector('[data-testid="phase-1-completed"]', { timeout: 15000 });
      
      // Verify handoff to next agent
      await page.waitForSelector('[data-testid="task-handoff-initiated"]', { timeout: 5000 });
      await expect(page.locator('[data-testid="current-agent"]')).toContainText('coder');
      
      // Monitor handoff completion
      await page.waitForSelector('[data-testid="task-handoff-completed"]', { timeout: 10000 });
      
      // Verify task progress
      const progressText = await page.locator('[data-testid="task-progress"]').textContent();
      expect(progressText).toContain('Phase 2');
    });

    // Test error handling in multi-agent scenarios
    await test.step('Test error handling in multi-agent workflow', async () => {
      // Simulate agent failure during workflow
      await dataManager.updateAgentStatus(workflowScenario.workers[0].id, 'error');
      
      // Wait for error detection
      await page.waitForSelector('[data-testid="agent-error-detected"]', { timeout: 5000 });
      
      // Verify coordinator handles the error
      await page.waitForSelector('[data-testid="coordinator-error-handling"]', { timeout: 5000 });
      
      // Check that workflow continues with remaining agents
      await expect(page.locator('[data-testid="workflow-status"]')).toContainText('Continuing with available agents');
      
      // Verify recovery mechanism
      await dataManager.updateAgentStatus(workflowScenario.workers[0].id, 'idle');
      await page.waitForSelector('[data-testid="agent-recovered-in-workflow"]', { timeout: 5000 });
    });

    // Test concurrent task execution
    await test.step('Test concurrent task execution', async () => {
      // Create multiple concurrent tasks
      for (let i = 0; i < 3; i++) {
        await stagehand.act(`Create concurrent task ${i + 1}`);
        await page.waitForSelector(`[data-testid="concurrent-task-${i + 1}-created"]`);
      }
      
      // Verify all tasks are running concurrently
      await page.waitForSelector('[data-testid="concurrent-execution-active"]', { timeout: 10000 });
      
      // Monitor resource usage during concurrent execution
      const concurrentMetrics = await performanceMonitor.captureMetrics();
      expect(concurrentMetrics.memoryUsage).toBeLessThan(2000 * 1024 * 1024); // 2GB
      
      // Verify UI remains responsive
      await stagehand.act('Click on task monitoring panel');
      await page.waitForSelector('[data-testid="task-monitoring-panel"]');
      
      const responseTime = await page.evaluate(() => {
        return performance.now();
      });
      
      await stagehand.act('Click refresh task status');
      
      const endTime = await page.evaluate(() => {
        return performance.now();
      });
      
      expect(endTime - responseTime).toBeLessThan(1000);
    });
  });
});