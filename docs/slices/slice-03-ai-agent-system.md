# SLICE 03: AI Agent System with Inngest

## METADATA
- **Complexity**: 🔴 Hard
- **Effort**: 8 story points
- **Priority**: High
- **Dependencies**: Slice 02
- **Team**: Backend + AI

## USER STORY
**As a** developer
**I want** AI agents orchestrated through background jobs
**So that** complex tasks are handled asynchronously

## TECHNICAL BREAKDOWN

### ⚙️ Backend Tasks
- [ ] Create agent base classes
- [ ] Implement Inngest functions for agents
- [ ] Build agent communication system
- [ ] Create task queue management
- [ ] Implement agent monitoring

### 🎨 Frontend Tasks
- [ ] Build agent dashboard
- [ ] Create task visualization
- [ ] Implement progress tracking
- [ ] Add agent chat interface

## CODE EXAMPLES

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

## ACCEPTANCE CRITERIA
1. Agents process tasks asynchronously
2. Inngest dashboard shows job progress
3. Agent communication works reliably
4. Error handling and retries work
5. Multi-agent coordination functional
6. Performance meets requirements

## DEFINITION OF DONE
- [ ] Base agent classes implemented
- [ ] Inngest functions created
- [ ] Agent tests written (TDD)
- [ ] Dashboard displays agent status
- [ ] Integration tests passing
- [ ] Documentation complete