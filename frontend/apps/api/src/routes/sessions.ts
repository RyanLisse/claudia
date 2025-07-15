import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { db, createSessionInput, insertSessionSchema } from '@claudia/db';
import { inngest } from '../inngest/client';

export const sessionsRouter = new Hono();

// GET /api/sessions
sessionsRouter.get('/', async (c) => {
  try {
    const sessions = await db.query.aiSessions.findMany({
      orderBy: (sessions, { desc }) => [desc(sessions.createdAt)],
      limit: 50,
    });
    
    return c.json({ sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return c.json({ error: 'Failed to fetch sessions' }, 500);
  }
});

// POST /api/sessions
sessionsRouter.post('/', zValidator('json', createSessionInput), async (c) => {
  try {
    const input = c.req.valid('json');
    
    const [session] = await db.insert(aiSessions).values(input).returning();
    
    // Send event to Inngest
    await inngest.send({
      name: 'session/created',
      data: {
        sessionId: session.id,
        userId: input.userId,
        name: input.name,
        timestamp: new Date().toISOString(),
      },
    });
    
    return c.json({ session }, 201);
  } catch (error) {
    console.error('Error creating session:', error);
    return c.json({ error: 'Failed to create session' }, 500);
  }
});

// GET /api/sessions/:id
sessionsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const session = await db.query.aiSessions.findFirst({
      where: (sessions, { eq }) => eq(sessions.id, id),
    });
    
    if (!session) {
      return c.json({ error: 'Session not found' }, 404);
    }
    
    return c.json({ session });
  } catch (error) {
    console.error('Error fetching session:', error);
    return c.json({ error: 'Failed to fetch session' }, 500);
  }
});