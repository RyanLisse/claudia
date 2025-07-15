import {
	boolean,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { projects } from "./projects";
import { users } from "./users";

export const agents = pgTable("agents", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: varchar("name", { length: 255 }).notNull(),
	type: varchar("type", { length: 100 }).notNull(), // 'coder', 'researcher', 'analyst', etc.
	description: text("description"),

	// Agent configuration
	config: jsonb("config")
		.$type<{
			model: string;
			temperature: number;
			maxTokens: number;
			systemPrompt: string;
			tools: string[];
			capabilities: string[];
			constraints: string[];
			hooks: {
				preTask: string[];
				postTask: string[];
				onError: string[];
			};
		}>()
		.notNull(),

	// Relationships
	createdBy: uuid("created_by")
		.references(() => users.id)
		.notNull(),
	projectId: uuid("project_id").references(() => projects.id),

	// Status and performance
	status: varchar("status", { length: 50 }).default("inactive"), // 'active', 'inactive', 'error', 'busy'
	version: varchar("version", { length: 20 }).default("1.0.0"),
	totalRuns: integer("total_runs").default(0),
	successfulRuns: integer("successful_runs").default(0),
	averageRunTime: integer("average_run_time").default(0), // milliseconds
	lastRunAt: timestamp("last_run_at"),

	// Performance metrics
	metrics: jsonb("metrics")
		.$type<{
			tokensUsed: number;
			avgResponseTime: number;
			errorRate: number;
			userRating: number;
			memoryUsage: number;
			cpuUsage: number;
		}>()
		.default({
			tokensUsed: 0,
			avgResponseTime: 0,
			errorRate: 0,
			userRating: 0,
			memoryUsage: 0,
			cpuUsage: 0,
		}),

	isActive: boolean("is_active").default(true),
	isPublic: boolean("is_public").default(false),

	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),

	// ElectricSQL sync metadata
	electricId: varchar("electric_id", { length: 128 }).unique(),
	syncVersion: varchar("sync_version", { length: 64 }).default("1"),
	lastSyncAt: timestamp("last_sync_at"),
});

export const insertAgentSchema = createInsertSchema(agents, {
	name: z.string().min(1).max(255),
	type: z.string().min(1).max(100),
	config: z.object({
		model: z.string(),
		temperature: z.number().min(0).max(2),
		maxTokens: z.number().positive(),
		systemPrompt: z.string(),
		tools: z.array(z.string()),
		capabilities: z.array(z.string()),
		constraints: z.array(z.string()),
		hooks: z.object({
			preTask: z.array(z.string()),
			postTask: z.array(z.string()),
			onError: z.array(z.string()),
		}),
	}),
});

export const selectAgentSchema = createSelectSchema(agents);

export type Agent = z.infer<typeof selectAgentSchema>;
export type NewAgent = z.infer<typeof insertAgentSchema>;
