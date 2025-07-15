import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { projects } from './projects';
import { sessions } from './sessions';

export const memory = pgTable('memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 500 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(), // 'user_preference', 'session_context', 'project_state', 'agent_learning'
  
  // Memory content
  content: jsonb('content').notNull(),
  summary: text('summary'),
  tags: jsonb('tags').$type<string[]>().default([]),
  
  // Relationships
  userId: uuid('user_id').references(() => users.id),
  projectId: uuid('project_id').references(() => projects.id),
  sessionId: uuid('session_id').references(() => sessions.id),
  
  // Memory metadata
  importance: integer('importance').default(1), // 1-10 scale
  frequency: integer('frequency').default(1), // how often accessed
  lastAccessedAt: timestamp('last_accessed_at').defaultNow(),
  expiresAt: timestamp('expires_at'), // null for permanent memories
  
  // Versioning
  version: integer('version').default(1),
  previousVersionId: uuid('previous_version_id'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // ElectricSQL sync metadata
  electricId: varchar('electric_id', { length: 128 }).unique(),
  syncVersion: varchar('sync_version', { length: 64 }).default('1'),
  lastSyncAt: timestamp('last_sync_at')
}, (table) => ({
  keyIdx: index('memory_key_idx').on(table.key),
  typeIdx: index('memory_type_idx').on(table.type),
  userIdx: index('memory_user_idx').on(table.userId),
  projectIdx: index('memory_project_idx').on(table.projectId),
  sessionIdx: index('memory_session_idx').on(table.sessionId),
  importanceIdx: index('memory_importance_idx').on(table.importance),
  tagsIdx: index('memory_tags_idx').using('gin', table.tags)
}));

export const insertMemorySchema = createInsertSchema(memory, {
  key: z.string().min(1).max(500),
  type: z.string().min(1).max(100),
  content: z.any(),
  importance: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).optional()
});

export const selectMemorySchema = createSelectSchema(memory);

export type Memory = z.infer<typeof selectMemorySchema>;
export type NewMemory = z.infer<typeof insertMemorySchema>;