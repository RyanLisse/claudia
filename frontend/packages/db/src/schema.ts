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
export type NewSession = z.infer<typeof insertSessionSchema>;
export type NewAgent = z.infer<typeof insertAgentSchema>;