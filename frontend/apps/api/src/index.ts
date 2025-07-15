import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { zValidator } from '@hono/zod-validator';
import { serve } from 'inngest/hono';
import { inngest } from './inngest/client';
import { createSessionInput } from '@claudia/db/schema';
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