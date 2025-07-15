import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { projects } from './projects';
import { agents } from './agents';

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Relationships
  userId: uuid('user_id').references(() => users.id).notNull(),
  projectId: uuid('project_id').references(() => projects.id),
  agentId: uuid('agent_id').references(() => agents.id),
  
  // Session data
  status: varchar('status', { length: 50 }).default('active'), // 'active', 'completed', 'error', 'paused'
  context: jsonb('context').$type<{
    workingDirectory: string;
    environment: Record<string, string>;
    files: string[];
    currentTask: string;
    previousTasks: string[];
    goals: string[];
  }>().default({
    workingDirectory: '',
    environment: {},
    files: [],
    currentTask: '',
    previousTasks: [],
    goals: []
  }),
  
  // Performance and metrics
  totalMessages: integer('total_messages').default(0),
  totalTokens: integer('total_tokens').default(0),
  totalCost: integer('total_cost').default(0), // in cents
  duration: integer('duration').default(0), // milliseconds
  
  // Session metadata
  metadata: jsonb('metadata').$type<{
    model: string;
    temperature: number;
    maxTokens: number;
    tools: string[];
    startedFrom: 'web' | 'desktop' | 'api' | 'cli';
    ipAddress?: string;
    userAgent?: string;
  }>(),
  
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
  lastActivityAt: timestamp('last_activity_at').defaultNow(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // ElectricSQL sync metadata
  electricId: varchar('electric_id', { length: 128 }).unique(),
  syncVersion: varchar('sync_version', { length: 64 }).default('1'),
  lastSyncAt: timestamp('last_sync_at')
});

export const insertSessionSchema = createInsertSchema(sessions, {
  title: z.string().min(1).max(255),
  context: z.object({
    workingDirectory: z.string(),
    environment: z.record(z.string()),
    files: z.array(z.string()),
    currentTask: z.string(),
    previousTasks: z.array(z.string()),
    goals: z.array(z.string())
  }).optional(),
  metadata: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().positive(),
    tools: z.array(z.string()),
    startedFrom: z.enum(['web', 'desktop', 'api', 'cli']),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
});

export const selectSessionSchema = createSelectSchema(sessions);

export type Session = z.infer<typeof selectSessionSchema>;
export type NewSession = z.infer<typeof insertSessionSchema>;