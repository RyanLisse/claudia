import {
	index,
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
import { sessions } from "./sessions";

export const messages = pgTable(
	"messages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		sessionId: uuid("session_id")
			.references(() => sessions.id, { onDelete: "cascade" })
			.notNull(),

		// Message content
		role: varchar("role", { length: 20 }).notNull(), // 'user', 'assistant', 'system', 'tool'
		content: text("content").notNull(),

		// Message metadata
		tokens: integer("tokens").default(0),
		cost: integer("cost").default(0), // in cents
		model: varchar("model", { length: 100 }),
		temperature: integer("temperature"), // stored as integer (temperature * 1000)

		// Tool and function calls
		toolCalls:
			jsonb("tool_calls").$type<
				Array<{
					id: string;
					type: string;
					function: {
						name: string;
						arguments: string;
					};
				}>
			>(),

		toolResults:
			jsonb("tool_results").$type<
				Array<{
					toolCallId: string;
					result: unknown;
					error?: string;
					duration: number;
				}>
			>(),

		// Response metadata
		responseMetadata: jsonb("response_metadata").$type<{
			finishReason: string;
			usage: {
				promptTokens: number;
				completionTokens: number;
				totalTokens: number;
			};
			processingTime: number;
			model: string;
		}>(),

		// Message ordering and timing
		sequenceNumber: integer("sequence_number").notNull(),
		parentMessageId: uuid("parent_message_id"),

		createdAt: timestamp("created_at").defaultNow().notNull(),

		// ElectricSQL sync metadata
		electricId: varchar("electric_id", { length: 128 }).unique(),
		syncVersion: varchar("sync_version", { length: 64 }).default("1"),
		lastSyncAt: timestamp("last_sync_at"),
	},
	(table) => ({
		sessionIdx: index("messages_session_idx").on(table.sessionId),
		sequenceIdx: index("messages_sequence_idx").on(
			table.sessionId,
			table.sequenceNumber,
		),
		roleIdx: index("messages_role_idx").on(table.role),
		createdAtIdx: index("messages_created_at_idx").on(table.createdAt),
	}),
);

export const insertMessageSchema = createInsertSchema(messages, {
	role: z.enum(["user", "assistant", "system", "tool"]),
	content: z.string().min(1),
	tokens: z.number().nonnegative().optional(),
	cost: z.number().nonnegative().optional(),
	sequenceNumber: z.number().nonnegative(),
	toolCalls: z
		.array(
			z.object({
				id: z.string(),
				type: z.string(),
				function: z.object({
					name: z.string(),
					arguments: z.string(),
				}),
			}),
		)
		.optional(),
	responseMetadata: z
		.object({
			finishReason: z.string(),
			usage: z.object({
				promptTokens: z.number(),
				completionTokens: z.number(),
				totalTokens: z.number(),
			}),
			processingTime: z.number(),
			model: z.string(),
		})
		.optional(),
});

export const selectMessageSchema = createSelectSchema(messages);

export type Message = z.infer<typeof selectMessageSchema>;
export type NewMessage = z.infer<typeof insertMessageSchema>;
