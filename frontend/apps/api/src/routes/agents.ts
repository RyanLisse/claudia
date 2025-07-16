import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HTTPException } from 'hono/http-exception';
import { db, insertAgentSchema, agents } from '@claudia/db';
import { inngest } from '../inngest/client';
import { z } from 'zod';

export const agentsRouter = new Hono();

// Enhanced validation schemas for security
const agentQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  type: z.string().max(100).optional(),
  status: z.enum(['active', 'inactive', 'error', 'busy']).optional(),
  search: z.string().max(255).optional()
});

const agentParamsSchema = z.object({
  id: z.string().uuid('Invalid agent ID format')
});

// GET /api/agents
agentsRouter.get('/', zValidator('query', agentQuerySchema), async (c) => {
  try {
    const query = c.req.valid('query');

    // Build secure query with validated parameters
    const agentList = await db.query.agents.findMany({
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      limit: query.limit,
      offset: query.offset,
      where: (agents, { and, eq, like, ilike }) => {
        const conditions = [];

        if (query.type) {
          conditions.push(eq(agents.type, query.type));
        }

        if (query.status) {
          conditions.push(eq(agents.status, query.status));
        }

        if (query.search) {
          // Use parameterized search to prevent injection
          conditions.push(ilike(agents.name, `%${query.search}%`));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
      }
    });

    return c.json({
      success: true,
      agents: agentList,
      count: agentList.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    throw new HTTPException(500, { message: 'Failed to fetch agents' });
  }
});

// POST /api/agents
agentsRouter.post('/', zValidator('json', insertAgentSchema), async (c) => {
  try {
    const input = c.req.valid('json');
    
    const [agent] = await db.insert(agents).values(input).returning();
    
    // Send event to Inngest
    await inngest.send({
      name: 'agent/created',
      data: {
        agentId: agent.id,
        sessionId: agent.sessionId || '',
        type: agent.type,
        timestamp: new Date().toISOString(),
      },
    });
    
    return c.json({ agent }, 201);
  } catch (error) {
    console.error('Error creating agent:', error);
    return c.json({ error: 'Failed to create agent' }, 500);
  }
});

// GET /api/agents/:id
agentsRouter.get('/:id', zValidator('param', agentParamsSchema), async (c) => {
  try {
    const { id } = c.req.valid('param');

    // Use parameterized query with validated UUID
    const agent = await db.query.agents.findFirst({
      where: (agents, { eq }) => eq(agents.id, id),
    });

    if (!agent) {
      throw new HTTPException(404, { message: 'Agent not found' });
    }

    return c.json({
      success: true,
      agent,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('Error fetching agent:', error);
    throw new HTTPException(500, { message: 'Failed to fetch agent' });
  }
});