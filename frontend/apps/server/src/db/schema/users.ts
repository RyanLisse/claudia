import {
	boolean,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
	id: uuid("id").primaryKey().defaultRandom(),
	email: varchar("email", { length: 255 }).unique().notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	avatarUrl: text("avatar_url"),
	preferences: jsonb("preferences")
		.$type<{
			theme: "light" | "dark" | "system";
			language: string;
			timezone: string;
			notifications: {
				email: boolean;
				push: boolean;
				desktop: boolean;
			};
		}>()
		.default({
			theme: "system",
			language: "en",
			timezone: "UTC",
			notifications: {
				email: true,
				push: true,
				desktop: true,
			},
		}),
	isActive: boolean("is_active").default(true).notNull(),
	lastActiveAt: timestamp("last_active_at").defaultNow(),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at").defaultNow().notNull(),

	// ElectricSQL sync metadata
	electricId: varchar("electric_id", { length: 128 }).unique(),
	syncVersion: varchar("sync_version", { length: 64 }).default("1"),
	lastSyncAt: timestamp("last_sync_at"),
});

export const insertUserSchema = createInsertSchema(users, {
	email: z.string().email(),
	name: z.string().min(1).max(255),
	preferences: z
		.object({
			theme: z.enum(["light", "dark", "system"]),
			language: z.string(),
			timezone: z.string(),
			notifications: z.object({
				email: z.boolean(),
				push: z.boolean(),
				desktop: z.boolean(),
			}),
		})
		.optional(),
});

export const selectUserSchema = createSelectSchema(users);

export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
