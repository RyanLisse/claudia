# Testing Architecture for Claudia AI Platform

## 🧪 Testing Strategy Overview

### Testing Pyramid Implementation
```
                     E2E Tests (5%)
                  ┌─────────────────────┐
                 │  Playwright + Stagehand │ ← User journeys, workflows
                └───────────────────────┘
              Integration Tests (15%)
             ┌─────────────────────────────┐
            │   API + DB + Real-time Sync   │ ← Component integration
           └───────────────────────────────┘
          Unit Tests (70%)
         ┌─────────────────────────────────────┐
        │  Components + Hooks + Utils + Logic  │ ← Fast, isolated tests
       └───────────────────────────────────────┘
      Static Analysis (10%)
     ┌───────────────────────────────────────────┐
    │   TypeScript + Biome + Accessibility      │ ← Zero-runtime validation
   └─────────────────────────────────────────────┘
```

## 📁 Test File Organization

### Directory Structure
```
tests/
├── unit/                          # Fast, isolated tests (70%)
│   ├── components/               # React component tests
│   │   ├── Button.test.tsx
│   │   ├── Input.test.tsx
│   │   ├── AgentCard.test.tsx
│   │   └── ChatInterface.test.tsx
│   ├── hooks/                    # Custom hook tests
│   │   ├── useRealtimeSync.test.ts
│   │   ├── useAgentState.test.ts
│   │   └── useOptimisticMutation.test.ts
│   ├── utils/                    # Utility function tests
│   │   ├── date-utils.test.ts
│   │   ├── validation.test.ts
│   │   └── api-client.test.ts
│   ├── services/                 # Business logic tests
│   │   ├── AgentService.test.ts
│   │   ├── SessionService.test.ts
│   │   └── TaskService.test.ts
│   └── stores/                   # State management tests
│       ├── authStore.test.ts
│       ├── uiStore.test.ts
│       └── syncStore.test.ts
├── integration/                   # Component integration tests (15%)
│   ├── api/                      # API integration tests
│   │   ├── agents.integration.test.ts
│   │   ├── sessions.integration.test.ts
│   │   └── auth.integration.test.ts
│   ├── database/                 # Database integration tests
│   │   ├── repositories.test.ts
│   │   ├── migrations.test.ts
│   │   └── sync.test.ts
│   ├── realtime/                 # Real-time feature tests
│   │   ├── electric-sync.test.ts
│   │   ├── optimistic-updates.test.ts
│   │   └── conflict-resolution.test.ts
│   └── workflows/                # End-to-end workflow tests
│       ├── agent-coordination.test.ts
│       ├── multi-user-sync.test.ts
│       └── task-execution.test.ts
├── e2e/                          # End-to-end tests (5%)
│   ├── specs/                    # Test specifications
│   │   ├── user-authentication.spec.ts
│   │   ├── agent-workflows.spec.ts
│   │   ├── real-time-collaboration.spec.ts
│   │   └── performance.spec.ts
│   ├── fixtures/                 # Test fixtures and data
│   │   ├── users.ts
│   │   ├── agents.ts
│   │   └── sessions.ts
│   └── pages/                    # Page object models
│       ├── AuthPage.ts
│       ├── DashboardPage.ts
│       └── AgentPage.ts
├── performance/                   # Performance tests (10%)
│   ├── load-testing/
│   ├── stress-testing/
│   └── benchmarks/
└── setup/                        # Test configuration
    ├── test-setup.ts             # Global test setup
    ├── jest-setup.ts             # Jest configuration
    ├── playwright-setup.ts       # Playwright setup
    └── mocks/                    # Mock implementations
        ├── api-mocks.ts
        ├── electric-mocks.ts
        └── inngest-mocks.ts
```

## 🔧 Test Configuration

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup/test-setup.ts'],
    include: ['**/*.{test,spec}.{js,ts,tsx}'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '**/*.d.ts',
        '**/dist/**'
      ],
      thresholds: {
        global: {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90
        }
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, './packages/ui'),
      '@db': path.resolve(__dirname, './packages/db'),
      '@agents': path.resolve(__dirname, './packages/ai-agents'),
      '@shared': path.resolve(__dirname, './packages/shared')
    }
  }
});
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'setup',
      testMatch: /setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup']
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup']
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup']
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup']
    }
  ],
  webServer: {
    command: 'bun run build && bun run start',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

## 🧩 Unit Testing Patterns

### React Component Testing
```typescript
// tests/unit/components/AgentCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentCard } from '@/components/AgentCard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('AgentCard', () => {
  const mockAgent = {
    id: 'agent-123',
    name: 'TypeScript Expert',
    type: 'coder' as const,
    status: 'idle' as const,
    capabilities: ['typescript', 'react'],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  it('should render agent information correctly', () => {
    render(<AgentCard agent={mockAgent} />, { wrapper: createWrapper() });
    
    expect(screen.getByText('TypeScript Expert')).toBeInTheDocument();
    expect(screen.getByText('coder')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('typescript')).toBeInTheDocument();
    expect(screen.getByText('react')).toBeInTheDocument();
  });

  it('should handle agent activation', async () => {
    const onActivate = vi.fn();
    const user = userEvent.setup();
    
    render(
      <AgentCard agent={mockAgent} onActivate={onActivate} />,
      { wrapper: createWrapper() }
    );
    
    await user.click(screen.getByRole('button', { name: /activate/i }));
    
    expect(onActivate).toHaveBeenCalledWith(mockAgent.id);
  });

  it('should show loading state during activation', async () => {
    const onActivate = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(
      <AgentCard agent={mockAgent} onActivate={onActivate} />,
      { wrapper: createWrapper() }
    );
    
    const button = screen.getByRole('button', { name: /activate/i });
    fireEvent.click(button);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Custom Hook Testing
```typescript
// tests/unit/hooks/useRealtimeSync.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

vi.mock('@electric-sql/react', () => ({
  useElectricShape: vi.fn()
}));

describe('useRealtimeSync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should sync data from Electric and API', async () => {
    const mockElectricData = [{ id: '1', name: 'Session 1' }];
    const mockApiData = [{ id: '2', name: 'Session 2' }];
    
    vi.mocked(useElectricShape).mockReturnValue({
      data: mockElectricData
    });
    
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(mockApiData)
    });

    const { result } = renderHook(
      () => useRealtimeSync(['sessions'], 'ai_sessions', sessionSchema),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toEqual(mockElectricData);
    });
  });

  it('should handle optimistic updates', async () => {
    const { result } = renderHook(
      () => useRealtimeSync(['sessions'], 'ai_sessions', sessionSchema),
      { wrapper: createWrapper() }
    );

    const update = { id: '1', name: 'Updated Session' };
    
    result.current.mutate(update);
    
    expect(result.current.isOptimistic).toBe(true);
    expect(result.current.data).toContainEqual(
      expect.objectContaining(update)
    );
  });
});
```

### Service Layer Testing
```typescript
// tests/unit/services/AgentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '@/services/AgentService';
import { db } from '@db/client';

vi.mock('@db/client');

describe('AgentService', () => {
  let agentService: AgentService;
  
  beforeEach(() => {
    agentService = new AgentService(db);
    vi.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create agent with validated input', async () => {
      const input = {
        sessionId: 'session-123',
        name: 'Test Agent',
        type: 'coder' as const,
        capabilities: ['typescript']
      };

      const mockAgent = { id: 'agent-123', ...input };
      vi.mocked(db.insert).mockResolvedValue([mockAgent]);

      const result = await agentService.createAgent(input);

      expect(result).toEqual(mockAgent);
      expect(db.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: input.sessionId,
          name: input.name,
          type: input.type,
          capabilities: input.capabilities
        })
      );
    });

    it('should throw error for invalid input', async () => {
      const invalidInput = {
        sessionId: 'invalid-uuid',
        name: '',
        type: 'invalid-type'
      };

      await expect(agentService.createAgent(invalidInput as any))
        .rejects.toThrow('Invalid agent input');
    });
  });
});
```

## 🔗 Integration Testing Patterns

### API Integration Testing
```typescript
// tests/integration/api/agents.integration.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { app } from '@/server';
import { db } from '@db/client';
import { agents, sessions } from '@db/schema';
import { createTestUser, createTestSession } from '../fixtures/test-data';

describe('Agents API Integration', () => {
  let testSession: any;
  let authToken: string;

  beforeAll(async () => {
    // Setup test database
    await db.migrate();
  });

  beforeEach(async () => {
    // Clean database
    await db.delete(agents);
    await db.delete(sessions);
    
    // Create test data
    const user = await createTestUser();
    testSession = await createTestSession(user.id);
    authToken = await generateAuthToken(user.id);
  });

  afterAll(async () => {
    await db.close();
  });

  it('should create agent via API', async () => {
    const agentData = {
      sessionId: testSession.id,
      name: 'API Test Agent',
      type: 'coder',
      capabilities: ['typescript', 'react']
    };

    const response = await app.request('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(agentData)
    });

    expect(response.status).toBe(201);
    
    const agent = await response.json();
    expect(agent).toMatchObject({
      id: expect.any(String),
      ...agentData,
      status: 'idle',
      createdAt: expect.any(String)
    });

    // Verify in database
    const dbAgent = await db.select()
      .from(agents)
      .where(eq(agents.id, agent.id))
      .limit(1);
    
    expect(dbAgent).toHaveLength(1);
  });

  it('should validate agent input', async () => {
    const invalidData = {
      sessionId: 'invalid-uuid',
      name: '',
      type: 'invalid-type'
    };

    const response = await app.request('/api/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(invalidData)
    });

    expect(response.status).toBe(400);
    
    const error = await response.json();
    expect(error.message).toContain('validation');
  });
});
```

### Real-time Sync Integration Testing
```typescript
// tests/integration/realtime/electric-sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ElectricSync } from '@db/electric';
import { createTestClients } from '../fixtures/electric-clients';

describe('ElectricSQL Sync Integration', () => {
  let client1: ElectricSync;
  let client2: ElectricSync;

  beforeAll(async () => {
    [client1, client2] = await createTestClients(2);
  });

  afterAll(async () => {
    await client1.disconnect();
    await client2.disconnect();
  });

  it('should sync data between clients in real-time', async () => {
    const updates: any[] = [];
    
    // Client 2 subscribes to changes
    const subscription = await client2.syncShape(
      'ai_sessions',
      sessionSchema,
      'user_id = "test-user"'
    );
    
    subscription.subscribe((data) => updates.push(data));

    // Client 1 creates a session
    await client1.insert('ai_sessions', {
      id: 'session-123',
      name: 'Test Session',
      userId: 'test-user'
    });

    // Wait for sync
    await waitFor(() => expect(updates).toHaveLength(1), {
      timeout: 1000
    });

    expect(updates[0]).toContainEqual(
      expect.objectContaining({
        id: 'session-123',
        name: 'Test Session'
      })
    );
  });

  it('should handle conflict resolution', async () => {
    const sessionId = 'conflict-session';
    
    // Both clients update the same record simultaneously
    const [update1, update2] = await Promise.allSettled([
      client1.update('ai_sessions', sessionId, { name: 'Name from Client 1' }),
      client2.update('ai_sessions', sessionId, { name: 'Name from Client 2' })
    ]);

    // Wait for conflict resolution
    await new Promise(resolve => setTimeout(resolve, 100));

    // Verify final state is consistent
    const [result1, result2] = await Promise.all([
      client1.select('ai_sessions', sessionId),
      client2.select('ai_sessions', sessionId)
    ]);

    expect(result1.name).toBe(result2.name);
  });
});
```

## 🎭 E2E Testing with Playwright & Stagehand

### User Journey Testing
```typescript
// tests/e2e/specs/agent-workflows.spec.ts
import { test, expect } from '../fixtures/test-base';

test.describe('AI Agent Workflows', () => {
  test('Complete agent creation and task execution', async ({ 
    page, 
    auth, 
    dashboard,
    stagehand 
  }) => {
    // Authenticate
    await auth.login('test@example.com', 'testpassword');
    
    // Navigate to dashboard
    await dashboard.goto();
    await expect(page).toHaveTitle(/AI Dev Platform/);

    // Create new session using natural language
    await stagehand.act('Create a new AI session named "E2E Test Session"');
    
    // Verify session creation
    await expect(page.locator('[data-testid="session-name"]'))
      .toContainText('E2E Test Session');

    // Create agent using AI assistance
    await stagehand.act('Add a new coder agent');
    await stagehand.act('Name the agent "E2E Test Agent"');
    await stagehand.act('Add TypeScript and React capabilities');
    await stagehand.act('Save the agent configuration');

    // Verify agent creation
    await expect(page.locator('[data-testid="agent-card"]'))
      .toContainText('E2E Test Agent');

    // Create and execute task
    await stagehand.act('Create a new task for this agent');
    await stagehand.act('Ask it to create a React button component');
    await stagehand.act('Submit the task');

    // Wait for task completion
    await expect(page.locator('[data-testid="task-status"]'))
      .toContainText('Completed', { timeout: 30000 });

    // Verify code output
    const codeOutput = page.locator('[data-testid="code-output"]');
    await expect(codeOutput).toContainText('export');
    await expect(codeOutput).toContainText('Button');
  });

  test('Multi-agent coordination workflow', async ({ page, dashboard }) => {
    await dashboard.goto();
    await dashboard.createSession('Multi-Agent Test');

    // Create multiple agents
    const agents = [
      { name: 'Researcher', type: 'research' },
      { name: 'Architect', type: 'architect' },
      { name: 'Coder', type: 'coder' },
      { name: 'Tester', type: 'tester' }
    ];

    for (const agent of agents) {
      await dashboard.createAgent(agent.name, agent.type);
    }

    // Create workflow
    await page.click('[data-testid="create-workflow"]');
    await page.fill('[name="workflow-name"]', 'Full Stack Feature');

    // Add workflow stages
    await dashboard.addWorkflowStage('Research Phase', ['Researcher']);
    await dashboard.addWorkflowStage('Design Phase', ['Architect']);
    await dashboard.addWorkflowStage('Implementation', ['Coder']);
    await dashboard.addWorkflowStage('Testing', ['Tester']);

    // Execute workflow
    await page.click('[data-testid="execute-workflow"]');

    // Monitor progress through all stages
    for (const stage of ['research', 'design', 'implementation', 'testing']) {
      await expect(page.locator(`[data-testid="stage-${stage}"]`))
        .toHaveAttribute('data-status', 'completed', { timeout: 120000 });
    }

    // Verify final deliverables
    await expect(page.locator('[data-testid="workflow-output"]'))
      .toContainText('Feature implementation complete');
  });
});
```

### Performance Testing
```typescript
// tests/e2e/specs/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('Dashboard loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(2000);

    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            vitals[entry.name] = entry.startTime || entry.value;
          });
          resolve(vitals);
        }).observe({ 
          entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
      });
    });

    expect(vitals['largest-contentful-paint']).toBeLessThan(2500);
    expect(vitals['layout-shift']).toBeLessThan(0.1);
  });

  test('Handles concurrent agent operations', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Create multiple agents concurrently
    const agentPromises = Array.from({ length: 10 }, (_, i) => 
      page.evaluate((index) => {
        return fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Concurrent Agent ${index}`,
            type: 'coder',
            sessionId: 'perf-test-session'
          })
        });
      }, i)
    );

    const startTime = Date.now();
    await Promise.all(agentPromises);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  });
});
```

## 🚀 Test Automation & CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, 'slice*-dev']
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run unit tests
        run: bun run test:unit --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run migrations
        run: bun run db:migrate
        env:
          DATABASE_URL: postgres://postgres:test@localhost:5432/test
      
      - name: Run integration tests
        run: bun run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Install Playwright
        run: bunx playwright install --with-deps
      
      - name: Build application
        run: bun run build
      
      - name: Run E2E tests
        run: bun run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📊 Test Metrics & Reporting

### Coverage Thresholds
- **Statements**: 90%
- **Branches**: 85%
- **Functions**: 90%
- **Lines**: 90%

### Performance Targets
- **Unit Tests**: < 10ms per test
- **Integration Tests**: < 100ms per test
- **E2E Tests**: < 30s per test
- **Total Test Suite**: < 5 minutes

### Quality Gates
- All tests must pass
- Coverage thresholds met
- No TypeScript errors
- Performance budgets met
- Accessibility tests pass

This comprehensive testing architecture ensures high-quality, reliable code across all development slices while maintaining fast feedback loops and comprehensive coverage.