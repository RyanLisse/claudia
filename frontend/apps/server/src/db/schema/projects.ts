import { pgTable, uuid, varchar, timestamp, boolean, text, jsonb, integer } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  path: varchar('path', { length: 1000 }).notNull(),
  gitUrl: varchar('git_url', { length: 500 }),
  gitBranch: varchar('git_branch', { length: 100 }).default('main'),
  
  // Owner and collaboration
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  collaborators: jsonb('collaborators').$type<string[]>().default([]),
  
  // Project configuration
  settings: jsonb('settings').$type<{
    language: string;
    framework: string;
    buildCommand: string;
    testCommand: string;
    lintCommand: string;
    environment: Record<string, string>;
    dependencies: string[];
    devDependencies: string[];
  }>().default({
    language: 'javascript',
    framework: 'react',
    buildCommand: 'npm run build',
    testCommand: 'npm test',
    lintCommand: 'npm run lint',
    environment: {},
    dependencies: [],
    devDependencies: []
  }),
  
  // Status and metadata
  status: varchar('status', { length: 50 }).default('active'),
  version: varchar('version', { length: 20 }).default('1.0.0'),
  lastBuildAt: timestamp('last_build_at'),
  totalSessions: integer('total_sessions').default(0),
  isArchived: boolean('is_archived').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  
  // ElectricSQL sync metadata
  electricId: varchar('electric_id', { length: 128 }).unique(),
  syncVersion: varchar('sync_version', { length: 64 }).default('1'),
  lastSyncAt: timestamp('last_sync_at')
});

export const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1).max(255),
  path: z.string().min(1).max(1000),
  gitUrl: z.string().url().optional(),
  gitBranch: z.string().max(100).optional(),
  settings: z.object({
    language: z.string(),
    framework: z.string(),
    buildCommand: z.string(),
    testCommand: z.string(),
    lintCommand: z.string(),
    environment: z.record(z.string()),
    dependencies: z.array(z.string()),
    devDependencies: z.array(z.string())
  }).optional()
});

export const selectProjectSchema = createSelectSchema(projects);

export type Project = z.infer<typeof selectProjectSchema>;
export type NewProject = z.infer<typeof insertProjectSchema>;