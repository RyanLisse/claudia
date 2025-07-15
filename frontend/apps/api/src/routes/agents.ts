import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db, insertAgentSchema, agents } from '@claudia/db';
import { inngest } from '../inngest/client';

export const agentsRouter = new Hono();

// GET /api/agents
agentsRouter.get('/', async (c) => {
  try {
    const agentList = await db.query.agents.findMany({
      orderBy: (agents, { desc }) => [desc(agents.createdAt)],
      limit: 50,
    });
    
    return c.json({ agents: agentList });
  } catch (error) {
    console.error('Error fetching agents:', error);
    return c.json({ error: 'Failed to fetch agents' }, 500);
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
agentsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const agent = await db.query.agents.findFirst({
      where: (agents, { eq }) => eq(agents.id, id),
    });
    
    if (!agent) {
      return c.json({ error: 'Agent not found' }, 404);
    }
    
    return c.json({ agent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    return c.json({ error: 'Failed to fetch agent' }, 500);
  }
});