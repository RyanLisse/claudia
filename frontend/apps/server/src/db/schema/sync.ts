import { pgTable, uuid, varchar, timestamp, text, jsonb, integer, boolean, index } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

export const syncEvents = pgTable('sync_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Event metadata
  eventType: varchar('event_type', { length: 100 }).notNull(), // 'create', 'update', 'delete', 'conflict'
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  
  // Sync data
  operation: varchar('operation', { length: 50 }).notNull(), // 'insert', 'update', 'delete'
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  conflictData: jsonb('conflict_data'), // for conflict resolution
  
  // Sync metadata
  syncVersion: varchar('sync_version', { length: 64 }).notNull(),
  clientId: varchar('client_id', { length: 128 }),
  userId: uuid('user_id'),
  
  // Status
  status: varchar('status', { length: 50 }).default('pending'), // 'pending', 'applied', 'conflict', 'failed'
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  
  // Timing
  appliedAt: timestamp('applied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  
  // ElectricSQL metadata
  electricId: varchar('electric_id', { length: 128 }).unique(),
  electricLsn: varchar('electric_lsn', { length: 128 }) // Log Sequence Number
}, (table) => ({
  eventTypeIdx: index('sync_events_event_type_idx').on(table.eventType),
  tableIdx: index('sync_events_table_idx').on(table.tableName),
  recordIdx: index('sync_events_record_idx').on(table.recordId),
  statusIdx: index('sync_events_status_idx').on(table.status),
  clientIdx: index('sync_events_client_idx').on(table.clientId),
  createdAtIdx: index('sync_events_created_at_idx').on(table.createdAt)
}));

export const syncConflicts = pgTable('sync_conflicts', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Conflict metadata
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  conflictType: varchar('conflict_type', { length: 100 }).notNull(), // 'concurrent_update', 'delete_update', 'unique_violation'
  
  // Conflict data
  localData: jsonb('local_data').notNull(),
  remoteData: jsonb('remote_data').notNull(),
  baseData: jsonb('base_data'), // common ancestor for 3-way merge
  
  // Resolution
  resolutionStrategy: varchar('resolution_strategy', { length: 100 }), // 'local_wins', 'remote_wins', 'merge', 'manual'
  resolvedData: jsonb('resolved_data'),
  resolvedBy: uuid('resolved_by'), // user who resolved the conflict
  resolvedAt: timestamp('resolved_at'),
  
  // Metadata
  clientId: varchar('client_id', { length: 128 }),
  userId: uuid('user_id'),
  isResolved: boolean('is_resolved').default(false),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  tableRecordIdx: index('sync_conflicts_table_record_idx').on(table.tableName, table.recordId),
  statusIdx: index('sync_conflicts_status_idx').on(table.isResolved),
  clientIdx: index('sync_conflicts_client_idx').on(table.clientId),
  createdAtIdx: index('sync_conflicts_created_at_idx').on(table.createdAt)
}));

export const syncMetrics = pgTable('sync_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Metrics data
  clientId: varchar('client_id', { length: 128 }).notNull(),
  metricType: varchar('metric_type', { length: 100 }).notNull(), // 'sync_latency', 'conflict_rate', 'bandwidth_usage'
  value: integer('value').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(), // 'ms', 'bytes', 'count', 'percentage'
  
  // Context
  tableName: varchar('table_name', { length: 100 }),
  operation: varchar('operation', { length: 50 }),
  metadata: jsonb('metadata'),
  
  // Timing
  measuredAt: timestamp('measured_at').defaultNow().notNull(),
  windowStart: timestamp('window_start'),
  windowEnd: timestamp('window_end')
}, (table) => ({
  clientMetricIdx: index('sync_metrics_client_metric_idx').on(table.clientId, table.metricType),
  measuredAtIdx: index('sync_metrics_measured_at_idx').on(table.measuredAt),
  tableIdx: index('sync_metrics_table_idx').on(table.tableName)
}));

export const insertSyncEventSchema = createInsertSchema(syncEvents, {
  eventType: z.string().min(1).max(100),
  tableName: z.string().min(1).max(100),
  operation: z.enum(['insert', 'update', 'delete']),
  syncVersion: z.string().min(1).max(64)
});

export const insertSyncConflictSchema = createInsertSchema(syncConflicts, {
  tableName: z.string().min(1).max(100),
  conflictType: z.string().min(1).max(100),
  localData: z.any(),
  remoteData: z.any(),
  resolutionStrategy: z.enum(['local_wins', 'remote_wins', 'merge', 'manual']).optional()
});

export const insertSyncMetricSchema = createInsertSchema(syncMetrics, {
  clientId: z.string().min(1).max(128),
  metricType: z.string().min(1).max(100),
  value: z.number(),
  unit: z.string().min(1).max(50)
});

export const selectSyncEventSchema = createSelectSchema(syncEvents);
export const selectSyncConflictSchema = createSelectSchema(syncConflicts);
export const selectSyncMetricSchema = createSelectSchema(syncMetrics);

export type SyncEvent = z.infer<typeof selectSyncEventSchema>;
export type NewSyncEvent = z.infer<typeof insertSyncEventSchema>;
export type SyncConflict = z.infer<typeof selectSyncConflictSchema>;
export type NewSyncConflict = z.infer<typeof insertSyncConflictSchema>;
export type SyncMetric = z.infer<typeof selectSyncMetricSchema>;
export type NewSyncMetric = z.infer<typeof insertSyncMetricSchema>;