Remembering...

I'll refactor and optimize the entire implementation plan with your modern TypeScript stack. Here's the comprehensive updated plan:

# AI Development Platform PRD: Modern TypeScript Implementation

## Executive Summary

A fully TypeScript-based AI development platform built with Bun runtime, Neon DB, and modern tooling for test-driven development.

## Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Frontend (Next.js 15 + Tauri + Bun)                │
│         TanStack Query | Zustand | shadcn/ui | Storybook        │
├─────────────────────────────────────────────────────────────────┤
│              Backend API (Hono + Bun Runtime)                   │
│          Drizzle ORM | Zod | Inngest | ElectricSQL             │
├─────────────────────────────────────────────────────────────────┤
│  VibeKit SDK  │  Modal Containers  │  E2B Sandboxes  │  Claude │
├─────────────────────────────────────────────────────────────────┤
│         Neon DB (Serverless PostgreSQL) + ElectricSQL          │
└─────────────────────────────────────────────────────────────────┘
```

## Development Setup

```bash
# Project structure
ai-dev-platform/
├── .git/
├── .husky/               # Git hooks
├── apps/
│   ├── web/             # Next.js frontend
│   ├── desktop/         # Tauri desktop app
│   └── api/             # Hono API server
├── packages/
│   ├── ui/              # Shared UI components
│   ├── db/              # Database schemas & migrations
│   ├── auth/            # Authentication logic
│   ├── ai-agents/       # AI agent implementations
│   └── shared/          # Shared types & utilities
├── tests/
│   ├── unit/            # Vitest unit tests
│   ├── integration/     # Vitest integration tests
│   └── e2e/             # Playwright + Stagehand tests
├── .storybook/          # Storybook configuration
├── biome.json           # Biome.js configuration
├── bunfig.toml          # Bun configuration
└── turbo.json           # Turborepo configuration
```

## Initial Setup Script

```bash
#!/bin/bash
# setup.sh

# Install Bun if not present
if ! command -v bun &> /dev/null; then
    curl -fsSL https://bun.sh/install | bash
fi

# Create monorepo structure
bun create vite@latest ai-dev-platform --template react-ts
cd ai-dev-platform

# Initialize workspace
cat > package.json << EOF
{
  "name": "ai-dev-platform",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "test": "turbo test",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "lint": "biome check .",
    "format": "biome format --write .",
    "prepare": "husky install",
    "storybook": "storybook dev -p 6006"
  }
}
EOF

# Install dependencies
bun add -d @biomejs/biome husky lint-staged turbo vitest @vitejs/plugin-react
bun add -d @playwright/test stagehand typescript @types/bun
bun add -d @storybook/react-vite storybook
bun add drizzle-orm @neondatabase/serverless zod
bun add @tanstack/react-query inngest hono @hono/zod-validator

# Setup Biome.js
cat > biome.json << EOF
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "off"
      }
    }
  },
  "organizeImports": {
    "enabled": true
  }
}
EOF

# Setup Husky
bun husky install
bun husky add .husky/pre-commit "bun lint-staged"

# Setup lint-staged
cat > .lintstagedrc.json << EOF
{
  "*.{ts,tsx,js,jsx}": ["biome check --apply"],
  "*.{json,md}": ["biome format --write"]
}
EOF

# Initialize Drizzle
mkdir -p packages/db
cd packages/db
bun init -y
bun add drizzle-orm @neondatabase/serverless drizzle-kit
```

---

# Vertical Slices (Updated for TypeScript Stack)

## SLICE 01: Project Foundation with TDD Setup

### METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 5 story points
- **Priority**: Critical
- **Dependencies**: None
- **Team**: Full Stack

### USER STORY
**As a** developer
**I want** a robust project foundation with TDD workflow
**So that** I can build features with confidence and maintain code quality

### TECHNICAL BREAKDOWN

#### 🎨 Frontend Tasks
- [ ] Set up Next.js 15 with Bun runtime
- [ ] Configure Vitest for React components
- [ ] Set up Storybook for component development
- [ ] Configure TanStack Query
- [ ] Implement base UI components with tests

#### ⚙️ Backend Tasks
- [ ] Set up Hono server with Bun
- [ ] Configure Neon DB connection
- [ ] Set up Drizzle ORM with migrations
- [ ] Configure Inngest for background jobs
- [ ] Create API testing harness

#### 🧪 Testing Tasks
- [ ] Configure Vitest for unit/integration tests
- [ ] Set up Playwright with Stagehand
- [ ] Create test utilities and fixtures
- [ ] Set up code coverage reporting

### CODE EXAMPLES

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

### TDD EXAMPLE

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

### ACCEPTANCE CRITERIA
1. All tooling configured and working
2. TDD workflow documented and enforced
3. CI/CD pipeline runs all tests
4. Code coverage > 80%
5. Storybook displays all components
6. Database migrations work properly

### DEFINITION OF DONE
- [ ] Bun project initialized with workspaces
- [ ] Testing framework configured
- [ ] Database connection established
- [ ] Basic API endpoints working
- [ ] Component library started
- [ ] CI/CD pipeline created

---

## SLICE 02: Real-time Sync with ElectricSQL and Neon

### METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 6 story points
- **Priority**: High
- **Dependencies**: Slice 01
- **Team**: Full Stack

### USER STORY
**As a** developer
**I want** real-time data synchronization
**So that** multiple users can collaborate seamlessly

### TECHNICAL BREAKDOWN

#### 🎨 Frontend Tasks
- [ ] Integrate ElectricSQL React hooks
- [ ] Implement optimistic updates with TanStack Query
- [ ] Create sync status indicators
- [ ] Build conflict resolution UI

#### ⚙️ Backend Tasks
- [ ] Configure ElectricSQL with Neon
- [ ] Set up shape definitions
- [ ] Implement auth for shapes
- [ ] Create sync monitoring

### CODE EXAMPLES

```typescript
// packages/db/electric.ts
import { ElectricClient, ShapeStream } from '@electric-sql/client';
import { z } from 'zod';

export class ElectricSync {
  private client: ElectricClient;
  
  constructor(private baseUrl: string) {
    this.client = new ElectricClient({
      url: baseUrl,
      headers: {
        'Authorization': `Bearer ${process.env.ELECTRIC_TOKEN}`
      }
    });
  }

  async syncShape<T extends z.ZodType>(
    table: string,
    schema: T,
    where?: string
  ): Promise<ShapeStream<z.infer<T>>> {
    const stream = await this.client.stream({
      table,
      where,
      columns: Object.keys(schema.shape)
    });

    return {
      ...stream,
      subscribe: (callback: (data: z.infer<T>[]) => void) => {
        return stream.subscribe((rawData) => {
          const validated = z.array(schema).parse(rawData);
          callback(validated);
        });
      }
    };
  }
}
```

```typescript
// hooks/useRealtimeSync.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectricShape } from '@electric-sql/react';
import { z } from 'zod';

export function useRealtimeData<T extends z.ZodType>(
  key: string[],
  table: string,
  schema: T,
  where?: string
) {
  const queryClient = useQueryClient();
  
  // Electric sync
  const { data: electricData } = useElectricShape({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: { table, where },
    parser: (data) => z.array(schema).parse(data)
  });

  // TanStack Query for local state
  const query = useQuery({
    queryKey: [...key, where],
    queryFn: async () => {
      const response = await fetch(`/api/${table}?${where}`);
      const data = await response.json();
      return schema.array().parse(data);
    },
    initialData: electricData,
    staleTime: Infinity // Let Electric handle updates
  });

  // Optimistic updates
  const mutation = useMutation({
    mutationFn: async (updates: Partial<z.infer<T>>) => {
      const response = await fetch(`/api/${table}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      
      queryClient.setQueryData(key, (old: any[]) => 
        old.map(item => 
          item.id === updates.id ? { ...item, ...updates } : item
        )
      );
      
      return { previous };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(key, context?.previous);
    }
  });

  return {
    data: query.data ?? electricData ?? [],
    isLoading: query.isLoading,
    mutate: mutation.mutate,
    isOptimistic: mutation.isPending
  };
}
```

```typescript
// tests/integration/sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '../utils/test-client';
import { ElectricSync } from '@db/electric';
import { insertSessionSchema } from '@db/schema';

describe('ElectricSQL Sync Integration', () => {
  let client1: any;
  let client2: any;
  let electricSync: ElectricSync;

  beforeAll(async () => {
    client1 = await createTestClient();
    client2 = await createTestClient();
    electricSync = new ElectricSync(process.env.ELECTRIC_URL!);
  });

  afterAll(async () => {
    await client1.close();
    await client2.close();
  });

  it('should sync data between clients in real-time', async () => {
    // Client 1 creates a session
    const session = await client1.post('/api/sessions', {
      name: 'Test Session',
      userId: 'user-123'
    });

    // Client 2 subscribes to sessions
    const updates: any[] = [];
    const stream = await electricSync.syncShape(
      'ai_sessions',
      insertSessionSchema,
      `user_id = 'user-123'`
    );

    const unsubscribe = stream.subscribe((data) => {
      updates.push(data);
    });

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(updates).toHaveLength(1);
    expect(updates[0]).toContainEqual(
      expect.objectContaining({
        id: session.id,
        name: 'Test Session'
      })
    );

    unsubscribe();
  });
});
```

### ACCEPTANCE CRITERIA
1. Real-time sync works with < 100ms latency
2. Offline changes sync when reconnected
3. Conflict resolution handles concurrent edits
4. Shape authorization prevents unauthorized access
5. Sync monitoring dashboard functional

### DEFINITION OF DONE
- [ ] ElectricSQL integrated with Neon
- [ ] React hooks created and tested
- [ ] Optimistic updates working
- [ ] Integration tests passing
- [ ] Performance benchmarks met

---

## SLICE 03: AI Agent System with Inngest

### METADATA
- **Complexity**: 🔴 Hard
- **Effort**: 8 story points
- **Priority**: High
- **Dependencies**: Slice 02
- **Team**: Backend + AI

### USER STORY
**As a** developer
**I want** AI agents orchestrated through background jobs
**So that** complex tasks are handled asynchronously

### TECHNICAL BREAKDOWN

#### ⚙️ Backend Tasks
- [ ] Create agent base classes
- [ ] Implement Inngest functions for agents
- [ ] Build agent communication system
- [ ] Create task queue management
- [ ] Implement agent monitoring

#### 🎨 Frontend Tasks
- [ ] Build agent dashboard
- [ ] Create task visualization
- [ ] Implement progress tracking
- [ ] Add agent chat interface

### CODE EXAMPLES

```typescript
// packages/ai-agents/base.ts
import { z } from 'zod';
import { EventPayload, inngest } from '@/inngest/client';

export const AgentTaskSchema = z.object({
  id: z.string(),
  type: z.string(),
  payload: z.any(),
  sessionId: z.string(),
  agentId: z.string(),
  priority: z.number().default(0),
  retries: z.number().default(0),
  createdAt: z.date().default(() => new Date())
});

export type AgentTask = z.infer<typeof AgentTaskSchema>;

export abstract class BaseAgent {
  constructor(
    protected id: string,
    protected type: string,
    protected capabilities: string[]
  ) {}

  abstract async execute(task: AgentTask): Promise<any>;
  abstract async validate(task: AgentTask): Promise<boolean>;

  async emit(event: string, data: any) {
    await inngest.send({
      name: `agent.${this.type}.${event}`,
      data: {
        agentId: this.id,
        timestamp: new Date(),
        ...data
      }
    });
  }
}
```

```typescript
// packages/ai-agents/coder-agent.ts
import { BaseAgent } from './base';
import { AgentTask } from './types';
import OpenAI from 'openai';

export class CoderAgent extends BaseAgent {
  private openai: OpenAI;

  constructor(id: string) {
    super(id, 'coder', ['typescript', 'react', 'nodejs']);
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  async validate(task: AgentTask): Promise<boolean> {
    return task.type === 'code-generation' || 
           task.type === 'code-review' ||
           task.type === 'refactor';
  }

  async execute(task: AgentTask): Promise<any> {
    await this.emit('task.started', { taskId: task.id });

    try {
      const result = await this.generateCode(task);
      
      await this.emit('task.completed', { 
        taskId: task.id, 
        result 
      });
      
      return result;
    } catch (error) {
      await this.emit('task.failed', { 
        taskId: task.id, 
        error: error.message 
      });
      throw error;
    }
  }

  private async generateCode(task: AgentTask) {
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert TypeScript developer..."
        },
        {
          role: "user",
          content: task.payload.prompt
        }
      ],
      temperature: 0.7,
      stream: true
    });

    let code = '';
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      code += content;
      
      // Emit progress
      await this.emit('task.progress', {
        taskId: task.id,
        chunk: content
      });
    }

    return { code };
  }
}
```

```typescript
// apps/api/src/inngest/functions.ts
import { inngest } from './client';
import { CoderAgent } from '@ai-agents/coder-agent';
import { db } from '@db/client';
import { agents, tasks } from '@db/schema';
import { eq } from 'drizzle-orm';

export const processAgentTask = inngest.createFunction(
  { id: 'process-agent-task', concurrency: 10 },
  { event: 'agent/task.created' },
  async ({ event, step }) => {
    // Load agent
    const agentData = await step.run('load-agent', async () => {
      return db.select()
        .from(agents)
        .where(eq(agents.id, event.data.agentId))
        .limit(1);
    });

    if (!agentData.length) {
      throw new Error('Agent not found');
    }

    // Create agent instance
    const agent = await step.run('create-agent', async () => {
      switch (agentData[0].type) {
        case 'coder':
          return new CoderAgent(agentData[0].id);
        default:
          throw new Error(`Unknown agent type: ${agentData[0].type}`);
      }
    });

    // Execute task
    const result = await step.run('execute-task', async () => {
      return agent.execute(event.data.task);
    });

    // Update task status
    await step.run('update-task', async () => {
      return db.update(tasks)
        .set({ 
          status: 'completed',
          result,
          completedAt: new Date()
        })
        .where(eq(tasks.id, event.data.task.id));
    });

    return { success: true, result };
  }
);

// Multi-agent coordination
export const coordinateAgents = inngest.createFunction(
  { id: 'coordinate-agents' },
  { event: 'workflow/started' },
  async ({ event, step }) => {
    const workflow = event.data.workflow;
    
    // Execute stages in sequence
    for (const stage of workflow.stages) {
      if (stage.parallel) {
        // Run agents in parallel
        const results = await step.run(`stage-${stage.id}`, async () => {
          return Promise.all(
            stage.tasks.map(task => 
              inngest.send({
                name: 'agent/task.created',
                data: { task, agentId: task.agentId }
              })
            )
          );
        });
      } else {
        // Run sequentially
        for (const task of stage.tasks) {
          await step.run(`task-${task.id}`, async () => {
            return inngest.send({
              name: 'agent/task.created',
              data: { task, agentId: task.agentId }
            });
          });
          
          // Wait for completion
          await step.waitForEvent(`agent.task.completed-${task.id}`, {
            timeout: '5m'
          });
        }
      }
    }

    return { completed: true };
  }
);
```

```typescript
// tests/unit/agents/coder-agent.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoderAgent } from '@ai-agents/coder-agent';
import { AgentTask } from '@ai-agents/types';

vi.mock('openai');

describe('CoderAgent', () => {
  let agent: CoderAgent;
  let mockTask: AgentTask;

  beforeEach(() => {
    agent = new CoderAgent('agent-123');
    mockTask = {
      id: 'task-123',
      type: 'code-generation',
      payload: { prompt: 'Create a React component' },
      sessionId: 'session-123',
      agentId: 'agent-123',
      priority: 1,
      retries: 0,
      createdAt: new Date()
    };
  });

  describe('validate', () => {
    it('should validate code generation tasks', async () => {
      expect(await agent.validate(mockTask)).toBe(true);
    });

    it('should reject non-code tasks', async () => {
      mockTask.type = 'research';
      expect(await agent.validate(mockTask)).toBe(false);
    });
  });

  describe('execute', () => {
    it('should generate code and emit events', async () => {
      const emitSpy = vi.spyOn(agent, 'emit');
      
      const result = await agent.execute(mockTask);
      
      expect(emitSpy).toHaveBeenCalledWith('task.started', 
        expect.objectContaining({ taskId: 'task-123' })
      );
      expect(emitSpy).toHaveBeenCalledWith('task.completed',
        expect.objectContaining({ taskId: 'task-123' })
      );
      expect(result).toHaveProperty('code');
    });
  });
});
```

### ACCEPTANCE CRITERIA
1. Agents process tasks asynchronously
2. Inngest dashboard shows job progress
3. Agent communication works reliably
4. Error handling and retries work
5. Multi-agent coordination functional
6. Performance meets requirements

### DEFINITION OF DONE
- [ ] Base agent classes implemented
- [ ] Inngest functions created
- [ ] Agent tests written (TDD)
- [ ] Dashboard displays agent status
- [ ] Integration tests passing
- [ ] Documentation complete

---

## SLICE 04: Component Library with Storybook

### METADATA
- **Complexity**: 🟢 Easy
- **Effort**: 4 story points
- **Priority**: Medium
- **Dependencies**: Slice 01
- **Team**: Frontend

### USER STORY
**As a** developer
**I want** a comprehensive component library
**So that** I can build consistent UIs quickly

### TECHNICAL BREAKDOWN

#### 🎨 Frontend Tasks
- [ ] Create base components with tests
- [ ] Set up Storybook stories
- [ ] Implement design tokens
- [ ] Add accessibility testing
- [ ] Create component documentation

### CODE EXAMPLES

```typescript
// packages/ui/components/Button/Button.tsx
import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@ui/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps 
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
```

```typescript
// packages/ui/components/Button/Button.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply variant styles', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');
  });

  it('should be disabled when prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

```typescript
// packages/ui/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon']
    }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <Button variant="default">Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="flex gap-4">
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🚀</Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <Button disabled>
      <span className="animate-spin mr-2">⏳</span>
      Loading...
    </Button>
  ),
};
```

### ACCEPTANCE CRITERIA
1. All components have tests with > 90% coverage
2. Storybook documents all components
3. Accessibility tests pass (WCAG 2.1 AA)
4. Components work across browsers
5. Design tokens implemented
6. Performance optimized

### DEFINITION OF DONE
- [ ] Core components created with tests
- [ ] Storybook stories written
- [ ] Accessibility tests passing
- [ ] Visual regression tests set up
- [ ] Documentation complete
- [ ] Published to npm registry

---

## SLICE 05: E2E Testing with Playwright and Stagehand

### METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 5 story points
- **Priority**: High
- **Dependencies**: Slice 04
- **Team**: QA + Frontend

### USER STORY
**As a** QA engineer
**I want** comprehensive E2E tests
**So that** I can ensure the platform works end-to-end

### TECHNICAL BREAKDOWN

#### 🧪 Testing Tasks
- [ ] Set up Playwright configuration
- [ ] Integrate Stagehand for AI testing
- [ ] Create test fixtures and helpers
- [ ] Write critical user journey tests
- [ ] Set up visual regression tests
- [ ] Create performance tests

### CODE EXAMPLES

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

### ACCEPTANCE CRITERIA
1. E2E tests cover all critical user journeys
2. Tests run in CI/CD pipeline
3. Visual regression tests catch UI changes
4. Performance tests ensure speed requirements
5. Stagehand AI tests work reliably
6. Test reports generated automatically

### DEFINITION OF DONE
- [ ] Playwright configured with all browsers
- [ ] Stagehand integrated for AI testing
- [ ] Critical user journeys tested
- [ ] Performance tests implemented
- [ ] CI/CD integration complete
- [ ] Test documentation written

---

## Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
- **Slice 01**: Project setup with TDD workflow
- Configure all tooling (Bun, Vitest, Playwright, etc.)
- Set up CI/CD with test automation
- Create initial component library structure

### Phase 2: Core Features (Weeks 3-5)
- **Slice 02**: ElectricSQL real-time sync
- **Slice 03**: AI Agent system with Inngest
- Implement TanStack Query patterns
- Create base UI components

### Phase 3: UI Development (Weeks 6-7)
- **Slice 04**: Complete component library
- Build Kanban board and chat interface
- Implement responsive design
- Add Storybook documentation

### Phase 4: Testing & Polish (Weeks 8-9)
- **Slice 05**: Comprehensive E2E testing
- Performance optimization
- Security audit
- Documentation completion

## Key Development Practices

### 1. TDD Workflow
```bash
# For every new feature:
1. Write failing test first
2. Implement minimal code to pass
3. Refactor while keeping tests green
4. Commit with conventional commits

# Example workflow:
bun test:watch  # Keep running in terminal
# Write test → See it fail → Implement → See it pass → Refactor
```

### 2. Type Safety with Zod
```typescript
// Always validate at boundaries
export const apiHandler = (schema: z.ZodSchema) => {
  return async (req: Request) => {
    const body = await req.json();
    const validated = schema.parse(body); // Throws if invalid
    // Process validated data
  };
};
```

### 3. Performance Monitoring
```typescript
// Use React DevTools Profiler
// Monitor with TanStack Query DevTools
// Track Core Web Vitals
// Set up Sentry for error tracking
```

### 4. Security Best Practices
- Input validation with Zod on all endpoints
- Rate limiting with Hono middleware
- CORS configuration for API
- Environment variable validation
- Regular dependency updates

## Success Metrics
- Test coverage > 80%
- All E2E tests passing
- Build time < 30 seconds
- API response time < 100ms (p95)
- Perfect Lighthouse scores
- Zero security vulnerabilities

This modern TypeScript stack with Bun provides excellent performance while maintaining type safety and developer experience. The TDD workflow ensures quality from the start, and the comprehensive testing strategy catches issues early.