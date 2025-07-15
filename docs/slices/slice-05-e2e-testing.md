# SLICE 05: E2E Testing with Playwright and Stagehand

## METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 5 story points
- **Priority**: High
- **Dependencies**: Slice 04
- **Team**: QA + Frontend

## USER STORY
**As a** QA engineer
**I want** comprehensive E2E tests
**So that** I can ensure the platform works end-to-end

## TECHNICAL BREAKDOWN

### 🧪 Testing Tasks
- [ ] Set up Playwright configuration
- [ ] Integrate Stagehand for AI testing
- [ ] Create test fixtures and helpers
- [ ] Write critical user journey tests
- [ ] Set up visual regression tests
- [ ] Create performance tests

## CODE EXAMPLES

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    }
  ],
  webServer: {
    command: 'bun run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

```typescript
// tests/e2e/fixtures/test-base.ts
import { test as base, expect } from '@playwright/test';
import { Stagehand } from '@stagehand/playwright';
import { AuthPage } from './pages/auth-page';
import { DashboardPage } from './pages/dashboard-page';

type TestFixtures = {
  auth: AuthPage;
  dashboard: DashboardPage;
  stagehand: Stagehand;
};

export const test = base.extend<TestFixtures>({
  auth: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },
  
  dashboard: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
  
  stagehand: async ({ page }, use) => {
    const stagehand = new Stagehand(page, {
      modelName: 'gpt-4',
      apiKey: process.env.OPENAI_API_KEY
    });
    await stagehand.init();
    await use(stagehand);
    await stagehand.cleanup();
  }
});

export { expect };
```

```typescript
// tests/e2e/specs/ai-agent-workflow.spec.ts
import { test, expect } from '../fixtures/test-base';

test.describe('AI Agent Workflow', () => {
  test.beforeEach(async ({ auth }) => {
    await auth.login('test@example.com', 'password');
  });

  test('should create and execute agent task', async ({ 
    page, 
    dashboard, 
    stagehand 
  }) => {
    // Navigate to dashboard
    await dashboard.goto();
    await expect(page).toHaveTitle(/AI Dev Platform/);

    // Create new session
    await dashboard.createSession('Test Session');
    
    // Use Stagehand AI to interact naturally
    await stagehand.act('Click on the Agents tab');
    await stagehand.act('Create a new coder agent');
    
    // Fill agent details
    await stagehand.act('Name the agent "TypeScript Expert"');
    await stagehand.act('Add capabilities: TypeScript, React, Node.js');
    
    // Submit and verify
    await stagehand.act('Save the agent');
    await expect(page.locator('[data-testid="agent-card"]'))
      .toContainText('TypeScript Expert');
    
    // Create a task
    await stagehand.act('Create a new task for this agent');
    await stagehand.act('Ask it to create a React component for a todo list');
    
    // Wait for completion
    await expect(page.locator('[data-testid="task-status"]'))
      .toContainText('Completed', { timeout: 30000 });
    
    // Verify code output
    const codeOutput = page.locator('[data-testid="code-output"]');
    await expect(codeOutput).toContainText('export const TodoList');
  });

  test('should handle multi-agent coordination', async ({ 
    page, 
    dashboard 
  }) => {
    await dashboard.goto();
    await dashboard.createSession('Multi-Agent Test');
    
    // Create multiple agents
    const agents = [
      { name: 'Researcher', type: 'research' },
      { name: 'Coder', type: 'coder' },
      { name: 'Reviewer', type: 'reviewer' }
    ];
    
    for (const agent of agents) {
      await dashboard.createAgent(agent.name, agent.type);
    }
    
    // Create workflow
    await page.click('[data-testid="create-workflow"]');
    await page.fill('[name="workflow-name"]', 'Full Stack Feature');
    
    // Add stages
    await dashboard.addWorkflowStage('Research', ['Researcher']);
    await dashboard.addWorkflowStage('Implementation', ['Coder']);
    await dashboard.addWorkflowStage('Review', ['Reviewer']);
    
    // Execute workflow
    await page.click('[data-testid="execute-workflow"]');
    
    // Monitor progress
    await expect(page.locator('[data-testid="stage-research"]'))
      .toHaveAttribute('data-status', 'completed', { timeout: 60000 });
    
    await expect(page.locator('[data-testid="stage-implementation"]'))
      .toHaveAttribute('data-status', 'completed', { timeout: 60000 });
    
    await expect(page.locator('[data-testid="stage-review"]'))
      .toHaveAttribute('data-status', 'completed', { timeout: 60000 });
  });
});
```

```typescript
// tests/e2e/specs/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load dashboard under 2 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve({
            lcp: entries.find(e => e.name === 'largest-contentful-paint')?.startTime,
            fid: entries.find(e => e.name === 'first-input')?.processingStart,
            cls: entries.find(e => e.name === 'layout-shift')?.value
          });
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
      });
    });
    
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.cls).toBeLessThan(0.1);
  });

  test('should handle 50 concurrent agent operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create multiple agents simultaneously
    const createAgentPromises = Array.from({ length: 50 }, (_, i) => 
      page.evaluate((index) => {
        return fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Agent ${index}`,
            type: 'coder',
            sessionId: 'perf-test-session'
          })
        });
      }, i)
    );
    
    const startTime = Date.now();
    await Promise.all(createAgentPromises);
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    
    // Verify all agents created
    const response = await page.request.get('/api/agents?sessionId=perf-test-session');
    const agents = await response.json();
    expect(agents).toHaveLength(50);
  });
});
```

## ACCEPTANCE CRITERIA
1. E2E tests cover all critical user journeys
2. Tests run in CI/CD pipeline
3. Visual regression tests catch UI changes
4. Performance tests ensure speed requirements
5. Stagehand AI tests work reliably
6. Test reports generated automatically

## DEFINITION OF DONE
- [ ] Playwright configured with all browsers
- [ ] Stagehand integrated for AI testing
- [ ] Critical user journeys tested
- [ ] Performance tests implemented
- [ ] CI/CD integration complete
- [ ] Test documentation written