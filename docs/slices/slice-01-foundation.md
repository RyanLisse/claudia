# SLICE 01: Project Foundation with TDD Setup

## METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 5 story points
- **Priority**: Critical
- **Dependencies**: None
- **Team**: Full Stack

## USER STORY
**As a** developer
**I want** a robust project foundation with TDD workflow
**So that** I can build features with confidence and maintain code quality

## TECHNICAL BREAKDOWN

### 🎨 Frontend Tasks
- [ ] Set up Next.js 15 with Bun runtime
- [ ] Configure Vitest for React components
- [ ] Set up Storybook for component development
- [ ] Configure TanStack Query
- [ ] Implement base UI components with tests

### ⚙️ Backend Tasks
- [ ] Set up Hono server with Bun
- [ ] Configure Neon DB connection
- [ ] Set up Drizzle ORM with migrations
- [ ] Configure Inngest for background jobs
- [ ] Create API testing harness

### 🧪 Testing Tasks
- [ ] Configure Vitest for unit/integration tests
- [ ] Set up Playwright with Stagehand
- [ ] Create test utilities and fixtures
- [ ] Set up code coverage reporting

## CODE EXAMPLES

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
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '*.config.*']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@db': path.resolve(__dirname, './packages/db'),
      '@ui': path.resolve(__dirname, './packages/ui')
    }
  }
});
```

```typescript
// packages/db/schema.ts
import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const agentTypeEnum = pgEnum('agent_type', [
  'research',
  'coder', 
  'reviewer',
  'analyst'
]);

export const agentStatusEnum = pgEnum('agent_status', [
  'idle',
  'busy',
  'error'
]);

export const aiSessions = pgTable('ai_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  status: text('status').default('active'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => aiSessions.id),
  type: agentTypeEnum('type').notNull(),
  status: agentStatusEnum('status').default('idle'),
  capabilities: jsonb('capabilities').$type<string[]>().default([]),
  currentTask: jsonb('current_task').$type<any>(),
  memory: jsonb('memory').default({}),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Zod schemas for validation
export const insertSessionSchema = createInsertSchema(aiSessions);
export const selectSessionSchema = createSelectSchema(aiSessions);
export const insertAgentSchema = createInsertSchema(agents);
export const selectAgentSchema = createSelectSchema(agents);

// Custom validation schemas
export const createSessionInput = z.object({
  name: z.string().min(1).max(255),
  userId: z.string().uuid()
});

export type Session = z.infer<typeof selectSessionSchema>;
export type Agent = z.infer<typeof selectAgentSchema>;
```

```typescript
// packages/db/client.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

// Migration helper
export async function runMigrations() {
  const { migrate } = await import('drizzle-orm/neon-http/migrator');
  await migrate(db, { migrationsFolder: './drizzle' });
}
```

```typescript
// apps/api/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { serve } from 'inngest/hono';
import { inngest } from './inngest/client';
import { createSessionInput } from '@db/schema';
import { sessionsRouter } from './routes/sessions';
import { agentsRouter } from './routes/agents';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', runtime: 'bun' }));

// API routes
app.route('/api/sessions', sessionsRouter);
app.route('/api/agents', agentsRouter);

// Inngest webhook
app.use('/api/inngest', serve({ client: inngest, functions: [] }));

// Error handling
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal Server Error' }, 500);
});

export default {
  port: process.env.PORT || 3001,
  fetch: app.fetch,
};
```

## TDD EXAMPLE

```typescript
// tests/unit/services/agent.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentService } from '@/services/agent';
import { db } from '@db/client';

vi.mock('@db/client');

describe('AgentService', () => {
  let agentService: AgentService;

  beforeEach(() => {
    agentService = new AgentService(db);
    vi.clearAllMocks();
  });

  describe('createAgent', () => {
    it('should create an agent with default status', async () => {
      // Arrange
      const input = {
        sessionId: 'session-123',
        type: 'coder' as const,
        capabilities: ['typescript', 'react']
      };

      const expectedAgent = {
        id: 'agent-123',
        ...input,
        status: 'idle',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      vi.mocked(db.insert).mockResolvedValueOnce([expectedAgent]);

      // Act
      const result = await agentService.createAgent(input);

      // Assert
      expect(result).toEqual(expectedAgent);
      expect(db.insert).toHaveBeenCalledWith(expect.objectContaining({
        sessionId: input.sessionId,
        type: input.type,
        capabilities: input.capabilities,
        status: 'idle'
      }));
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const invalidInput = {
        sessionId: 'not-a-uuid',
        type: 'invalid-type'
      };

      // Act & Assert
      await expect(agentService.createAgent(invalidInput as any))
        .rejects.toThrow('Invalid agent input');
    });
  });
});
```

## ACCEPTANCE CRITERIA
1. All tooling configured and working
2. TDD workflow documented and enforced
3. CI/CD pipeline runs all tests
4. Code coverage > 80%
5. Storybook displays all components
6. Database migrations work properly

## DEFINITION OF DONE
- [ ] Bun project initialized with workspaces
- [ ] Testing framework configured
- [ ] Database connection established
- [ ] Basic API endpoints working
- [ ] Component library started
- [ ] CI/CD pipeline created