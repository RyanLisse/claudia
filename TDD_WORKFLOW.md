# Test-Driven Development Workflow for Claudia

## 🚀 TDD Methodology & Worktree Strategy

### The TDD Cycle (Red-Green-Refactor)
```
1. 🔴 RED: Write a failing test first
2. 🟢 GREEN: Write minimal code to make it pass
3. 🔄 REFACTOR: Improve code while keeping tests green
4. 📝 COMMIT: Commit with conventional commit messages
```

### Parallel Development with Worktrees

Each slice can be developed independently using dedicated worktrees:

```bash
# Slice 01: Foundation & TDD Setup
cd worktrees/slice01
git checkout slice01-dev
bun run dev:foundation

# Slice 02: Real-time Sync
cd worktrees/slice02  
git checkout tdd-slice02
bun run dev:sync

# Slice 03: AI Agent System
cd worktrees/slice03
git checkout feature-slice03
bun run dev:agents

# Slice 04: Component Library
cd worktrees/slice04
git checkout testing-slice04
bun run dev:components

# Slice 05: E2E Testing
cd worktrees/slice05
git checkout integration-slice05
bun run dev:e2e
```

## 🧪 Testing Architecture

### Testing Pyramid Structure
```
                    E2E Tests (Slow, High Value)
                   ┌─────────────────────────┐
                  │   Playwright + Stagehand  │
                 └───────────────────────────┘
                Integration Tests (Medium Speed)
               ┌─────────────────────────────────┐
              │     API + Database + Real-time    │
             └───────────────────────────────────┘
            Unit Tests (Fast, Low-level)
           ┌─────────────────────────────────────────┐
          │   Components + Hooks + Utils + Services   │
         └───────────────────────────────────────────┘
        Static Analysis (Instant)
       ┌───────────────────────────────────────────────┐
      │    TypeScript + Biome + ESLint + Type Checking  │
     └─────────────────────────────────────────────────┘
```

### Test Coverage Goals
- **Unit Tests**: 90%+ coverage
- **Integration Tests**: 80%+ coverage for critical paths
- **E2E Tests**: 100% coverage for user journeys
- **Performance Tests**: Core Web Vitals compliance

## 📋 Slice-by-Slice TDD Implementation

### SLICE 01: Foundation & TDD Setup

#### TDD Tasks:
1. **Test Infrastructure Setup**
   ```bash
   # First, write test for Vitest configuration
   touch tests/setup/vitest.config.test.ts
   
   # Write failing test
   describe('Vitest Configuration', () => {
     it('should load test environment correctly', () => {
       expect(process.env.NODE_ENV).toBe('test');
     });
   });
   
   # Implement configuration
   # Run test to see it pass
   bun test tests/setup/vitest.config.test.ts
   ```

2. **Database Connection TDD**
   ```typescript
   // tests/integration/database.test.ts
   describe('Database Connection', () => {
     it('should connect to Neon DB successfully', async () => {
       const db = await createDbConnection();
       expect(db).toBeDefined();
       await db.close();
     });
     
     it('should run migrations', async () => {
       await runMigrations();
       const tables = await db.select().from(information_schema.tables);
       expect(tables).toContainEqual(
         expect.objectContaining({ table_name: 'ai_sessions' })
       );
     });
   });
   ```

3. **API Endpoint TDD**
   ```typescript
   // tests/integration/api/health.test.ts
   describe('Health Endpoint', () => {
     it('should return 200 OK with status', async () => {
       const response = await request(app).get('/health');
       expect(response.status).toBe(200);
       expect(response.body).toEqual({
         status: 'ok',
         runtime: 'bun',
         timestamp: expect.any(String)
       });
     });
   });
   ```

#### Success Criteria:
- [ ] All tooling tests pass
- [ ] Database connection verified
- [ ] Basic API endpoints working
- [ ] CI/CD pipeline green
- [ ] Code coverage > 90%

### SLICE 02: Real-time Sync with ElectricSQL

#### TDD Tasks:
1. **Electric Client Setup**
   ```typescript
   // tests/integration/electric.test.ts
   describe('ElectricSQL Client', () => {
     it('should initialize ElectricSQL client', async () => {
       const client = new ElectricClient(config);
       await expect(client.connect()).resolves.not.toThrow();
     });
     
     it('should sync data in real-time', async () => {
       const stream = await client.stream({ table: 'ai_sessions' });
       const updates: any[] = [];
       
       stream.subscribe((data) => updates.push(data));
       
       // Trigger change in another client
       await client2.insert('ai_sessions', { name: 'Test Session' });
       
       await waitFor(() => expect(updates).toHaveLength(1));
     });
   });
   ```

2. **Optimistic Updates TDD**
   ```typescript
   // tests/unit/hooks/useRealtimeSync.test.tsx
   describe('useRealtimeSync Hook', () => {
     it('should update optimistically', async () => {
       const { result } = renderHook(() => 
         useRealtimeSync('sessions', sessionSchema)
       );
       
       act(() => {
         result.current.mutate({ id: '1', name: 'Updated' });
       });
       
       // Should update immediately (optimistic)
       expect(result.current.data).toContainEqual(
         expect.objectContaining({ name: 'Updated' })
       );
     });
   });
   ```

#### Success Criteria:
- [ ] Real-time sync working < 100ms latency
- [ ] Optimistic updates functional
- [ ] Conflict resolution tested
- [ ] Integration tests passing
- [ ] Performance benchmarks met

### SLICE 03: AI Agent System with Inngest

#### TDD Tasks:
1. **Agent Base Class TDD**
   ```typescript
   // tests/unit/agents/base-agent.test.ts
   describe('BaseAgent', () => {
     it('should validate tasks correctly', async () => {
       const agent = new TestAgent('test-1', 'test', ['capability1']);
       
       const validTask = { type: 'test-task', payload: {} };
       const invalidTask = { type: 'invalid-task', payload: {} };
       
       expect(await agent.validate(validTask)).toBe(true);
       expect(await agent.validate(invalidTask)).toBe(false);
     });
     
     it('should emit events during execution', async () => {
       const agent = new TestAgent('test-1', 'test', []);
       const emitSpy = vi.spyOn(agent, 'emit');
       
       await agent.execute(mockTask);
       
       expect(emitSpy).toHaveBeenCalledWith('task.started', 
         expect.objectContaining({ taskId: mockTask.id })
       );
     });
   });
   ```

2. **Inngest Functions TDD**
   ```typescript
   // tests/integration/inngest/agent-tasks.test.ts
   describe('Agent Task Processing', () => {
     it('should process agent tasks through Inngest', async () => {
       const taskData = {
         id: 'task-123',
         type: 'code-generation',
         agentId: 'agent-456',
         payload: { prompt: 'Create a React component' }
       };
       
       const result = await inngest.send({
         name: 'agent/task.created',
         data: taskData
       });
       
       expect(result).toMatchObject({
         success: true,
         result: expect.objectContaining({
           code: expect.stringContaining('export')
         })
       });
     });
   });
   ```

3. **Multi-Agent Coordination TDD**
   ```typescript
   // tests/integration/coordination.test.ts
   describe('Multi-Agent Coordination', () => {
     it('should coordinate multiple agents in workflow', async () => {
       const workflow = {
         stages: [
           { id: 'research', parallel: false, tasks: [researchTask] },
           { id: 'implement', parallel: true, tasks: [codeTask1, codeTask2] },
           { id: 'review', parallel: false, tasks: [reviewTask] }
         ]
       };
       
       const result = await inngest.send({
         name: 'workflow/started',
         data: { workflow }
       });
       
       expect(result.completed).toBe(true);
       expect(result.stages).toHaveLength(3);
     });
   });
   ```

#### Success Criteria:
- [ ] Agents process tasks asynchronously
- [ ] Inngest dashboard functional
- [ ] Multi-agent coordination working
- [ ] Error handling and retries tested
- [ ] Performance requirements met

### SLICE 04: Component Library with Storybook

#### TDD Tasks:
1. **Component Development TDD**
   ```typescript
   // packages/ui/components/Button/Button.test.tsx
   describe('Button Component', () => {
     it('should render with correct variant styles', () => {
       render(<Button variant="destructive">Delete</Button>);
       expect(screen.getByRole('button')).toHaveClass('bg-destructive');
     });
     
     it('should handle click events', async () => {
       const handleClick = vi.fn();
       const user = userEvent.setup();
       
       render(<Button onClick={handleClick}>Click me</Button>);
       await user.click(screen.getByRole('button'));
       
       expect(handleClick).toHaveBeenCalledTimes(1);
     });
     
     it('should be accessible', async () => {
       render(<Button>Accessible Button</Button>);
       const results = await axe(document.body);
       expect(results).toHaveNoViolations();
     });
   });
   ```

2. **Storybook Integration TDD**
   ```typescript
   // tests/integration/storybook.test.ts
   describe('Storybook Integration', () => {
     it('should load all component stories', async () => {
       const stories = await getStorybookStories();
       
       expect(stories).toContain('Button/Default');
       expect(stories).toContain('Button/AllVariants');
       expect(stories).toContain('Input/Default');
     });
     
     it('should render stories without errors', async () => {
       const stories = await renderAllStories();
       
       stories.forEach(story => {
         expect(story.errors).toHaveLength(0);
       });
     });
   });
   ```

3. **Design Token TDD**
   ```typescript
   // tests/unit/design-tokens.test.ts
   describe('Design Tokens', () => {
     it('should have consistent color palette', () => {
       expect(colors.primary[500]).toBeDefined();
       expect(colors.secondary[500]).toBeDefined();
       expect(colors.destructive[500]).toBeDefined();
     });
     
     it('should have accessible color contrasts', () => {
       const contrast = getContrastRatio(colors.primary[500], colors.background);
       expect(contrast).toBeGreaterThan(4.5); // WCAG AA standard
     });
   });
   ```

#### Success Criteria:
- [ ] All components tested > 90% coverage
- [ ] Storybook documents all components
- [ ] Accessibility tests pass (WCAG 2.1 AA)
- [ ] Visual regression tests setup
- [ ] Design tokens validated

### SLICE 05: E2E Testing with Playwright & Stagehand

#### TDD Tasks:
1. **Critical User Journey Tests**
   ```typescript
   // tests/e2e/user-journeys/agent-workflow.spec.ts
   test('Complete AI Agent Workflow', async ({ page, stagehand }) => {
     // Navigate and authenticate
     await page.goto('/dashboard');
     await stagehand.act('Sign in with test credentials');
     
     // Create session
     await stagehand.act('Create a new AI session named "Test Workflow"');
     await expect(page.locator('[data-testid="session-name"]'))
       .toContainText('Test Workflow');
     
     // Create and configure agent
     await stagehand.act('Add a new coder agent');
     await stagehand.act('Name it "TypeScript Expert"');
     await stagehand.act('Add TypeScript and React capabilities');
     
     // Create task
     await stagehand.act('Create a task to build a todo component');
     
     // Verify completion
     await expect(page.locator('[data-testid="task-status"]'))
       .toContainText('Completed', { timeout: 30000 });
       
     // Verify code output
     await expect(page.locator('[data-testid="code-output"]'))
       .toContainText('export const TodoComponent');
   });
   ```

2. **Performance Testing TDD**
   ```typescript
   // tests/e2e/performance/core-web-vitals.spec.ts
   test('Core Web Vitals Performance', async ({ page }) => {
     await page.goto('/dashboard');
     
     const metrics = await page.evaluate(() => {
       return new Promise((resolve) => {
         new PerformanceObserver((list) => {
           const vitals = {};
           list.getEntries().forEach((entry) => {
             vitals[entry.name] = entry.startTime || entry.value;
           });
           resolve(vitals);
         }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
       });
     });
     
     expect(metrics.lcp).toBeLessThan(2500);
     expect(metrics.cls).toBeLessThan(0.1);
   });
   ```

3. **AI Agent E2E Tests**
   ```typescript
   // tests/e2e/ai-workflows/multi-agent.spec.ts
   test('Multi-Agent Coordination', async ({ page }) => {
     await page.goto('/dashboard');
     
     // Create multiple agents
     const agents = ['Researcher', 'Coder', 'Reviewer'];
     for (const agent of agents) {
       await page.click('[data-testid="add-agent"]');
       await page.fill('[name="agent-name"]', agent);
       await page.click('[data-testid="save-agent"]');
     }
     
     // Create workflow
     await page.click('[data-testid="create-workflow"]');
     await page.fill('[name="workflow-name"]', 'Full Stack Feature');
     
     // Execute and monitor
     await page.click('[data-testid="execute-workflow"]');
     
     // Verify all stages complete
     await expect(page.locator('[data-testid^="stage-"]'))
       .toHaveAttribute('data-status', 'completed', { timeout: 120000 });
   });
   ```

#### Success Criteria:
- [ ] All critical user journeys tested
- [ ] Performance benchmarks met
- [ ] AI workflows validated
- [ ] Cross-browser compatibility verified
- [ ] CI/CD integration complete

## 🔄 TDD Workflow Commands

### Development Commands
```bash
# Start TDD cycle
bun run test:watch              # Continuous testing
bun run test:coverage           # Coverage reports
bun run test:ui                 # Vitest UI

# Run specific test types
bun run test:unit               # Unit tests only
bun run test:integration        # Integration tests
bun run test:e2e                # E2E tests
bun run test:e2e:ui             # E2E with UI

# Slice-specific testing
bun run test:slice01            # Foundation tests
bun run test:slice02            # Sync tests
bun run test:slice03            # Agent tests
bun run test:slice04            # Component tests
bun run test:slice05            # E2E tests

# Quality checks
bun run lint                    # Static analysis
bun run typecheck              # Type checking
bun run format                 # Code formatting
```

### Git Workflow
```bash
# Feature development (TDD cycle)
git checkout -b feature/new-component
# Write test → See it fail → Implement → See it pass → Refactor
git add tests/ src/
git commit -m "feat: add new component with tests"

# Merge to slice branch
git checkout slice04-dev
git merge feature/new-component

# Integration to main
git checkout main
git merge slice04-dev
```

## 📊 Quality Metrics

### Test Coverage Targets
- **Unit Tests**: 90%+ line coverage
- **Integration Tests**: 80%+ feature coverage  
- **E2E Tests**: 100% user journey coverage
- **Performance Tests**: Core Web Vitals compliance

### Success Indicators
- ✅ All tests pass in CI/CD
- ✅ Code coverage meets targets
- ✅ Performance benchmarks met
- ✅ Zero TypeScript errors
- ✅ No accessibility violations
- ✅ Security scans pass

This TDD workflow ensures high-quality code with comprehensive test coverage across all development slices.