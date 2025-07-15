CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(100) NOT NULL,
	"description" text,
	"config" jsonb NOT NULL,
	"created_by" uuid NOT NULL,
	"project_id" uuid,
	"status" varchar(50) DEFAULT 'inactive',
	"version" varchar(20) DEFAULT '1.0.0',
	"total_runs" integer DEFAULT 0,
	"successful_runs" integer DEFAULT 0,
	"average_run_time" integer DEFAULT 0,
	"last_run_at" timestamp,
	"metrics" jsonb DEFAULT '{"tokensUsed":0,"avgResponseTime":0,"errorRate":0,"userRating":0,"memoryUsage":0,"cpuUsage":0}'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "agents_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(500) NOT NULL,
	"type" varchar(100) NOT NULL,
	"content" jsonb NOT NULL,
	"summary" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"user_id" uuid,
	"project_id" uuid,
	"session_id" uuid,
	"importance" integer DEFAULT 1,
	"frequency" integer DEFAULT 1,
	"last_accessed_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"version" integer DEFAULT 1,
	"previous_version_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "memory_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"tokens" integer DEFAULT 0,
	"cost" integer DEFAULT 0,
	"model" varchar(100),
	"temperature" integer,
	"tool_calls" jsonb,
	"tool_results" jsonb,
	"response_metadata" jsonb,
	"sequence_number" integer NOT NULL,
	"parent_message_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "messages_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"path" varchar(1000) NOT NULL,
	"git_url" varchar(500),
	"git_branch" varchar(100) DEFAULT 'main',
	"owner_id" uuid NOT NULL,
	"collaborators" jsonb DEFAULT '[]'::jsonb,
	"settings" jsonb DEFAULT '{"language":"javascript","framework":"react","buildCommand":"npm run build","testCommand":"npm test","lintCommand":"npm run lint","environment":{},"dependencies":[],"devDependencies":[]}'::jsonb,
	"status" varchar(50) DEFAULT 'active',
	"version" varchar(20) DEFAULT '1.0.0',
	"last_build_at" timestamp,
	"total_sessions" integer DEFAULT 0,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "projects_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"agent_id" uuid,
	"status" varchar(50) DEFAULT 'active',
	"context" jsonb DEFAULT '{"workingDirectory":"","environment":{},"files":[],"currentTask":"","previousTasks":[],"goals":[]}'::jsonb,
	"total_messages" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"total_cost" integer DEFAULT 0,
	"duration" integer DEFAULT 0,
	"metadata" jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"last_activity_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "sessions_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "sync_conflicts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"conflict_type" varchar(100) NOT NULL,
	"local_data" jsonb NOT NULL,
	"remote_data" jsonb NOT NULL,
	"base_data" jsonb,
	"resolution_strategy" varchar(100),
	"resolved_data" jsonb,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"client_id" varchar(128),
	"user_id" uuid,
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"operation" varchar(50) NOT NULL,
	"old_data" jsonb,
	"new_data" jsonb,
	"conflict_data" jsonb,
	"sync_version" varchar(64) NOT NULL,
	"client_id" varchar(128),
	"user_id" uuid,
	"status" varchar(50) DEFAULT 'pending',
	"error_message" text,
	"retry_count" integer DEFAULT 0,
	"applied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"electric_lsn" varchar(128),
	CONSTRAINT "sync_events_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
CREATE TABLE "sync_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" varchar(128) NOT NULL,
	"metric_type" varchar(100) NOT NULL,
	"value" integer NOT NULL,
	"unit" varchar(50) NOT NULL,
	"table_name" varchar(100),
	"operation" varchar(50),
	"metadata" jsonb,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"window_start" timestamp,
	"window_end" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"preferences" jsonb DEFAULT '{"theme":"system","language":"en","timezone":"UTC","notifications":{"email":true,"push":true,"desktop":true}}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"electric_id" varchar(128),
	"sync_version" varchar(64) DEFAULT '1',
	"last_sync_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_electric_id_unique" UNIQUE("electric_id")
);
--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memory" ADD CONSTRAINT "memory_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "memory_key_idx" ON "memory" USING btree ("key");--> statement-breakpoint
CREATE INDEX "memory_type_idx" ON "memory" USING btree ("type");--> statement-breakpoint
CREATE INDEX "memory_user_idx" ON "memory" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memory_project_idx" ON "memory" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "memory_session_idx" ON "memory" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "memory_importance_idx" ON "memory" USING btree ("importance");--> statement-breakpoint
CREATE INDEX "memory_tags_idx" ON "memory" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "messages_session_idx" ON "messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "messages_sequence_idx" ON "messages" USING btree ("session_id","sequence_number");--> statement-breakpoint
CREATE INDEX "messages_role_idx" ON "messages" USING btree ("role");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_conflicts_table_record_idx" ON "sync_conflicts" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "sync_conflicts_status_idx" ON "sync_conflicts" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "sync_conflicts_client_idx" ON "sync_conflicts" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sync_conflicts_created_at_idx" ON "sync_conflicts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_events_event_type_idx" ON "sync_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "sync_events_table_idx" ON "sync_events" USING btree ("table_name");--> statement-breakpoint
CREATE INDEX "sync_events_record_idx" ON "sync_events" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "sync_events_status_idx" ON "sync_events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "sync_events_client_idx" ON "sync_events" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "sync_events_created_at_idx" ON "sync_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sync_metrics_client_metric_idx" ON "sync_metrics" USING btree ("client_id","metric_type");--> statement-breakpoint
CREATE INDEX "sync_metrics_measured_at_idx" ON "sync_metrics" USING btree ("measured_at");--> statement-breakpoint
CREATE INDEX "sync_metrics_table_idx" ON "sync_metrics" USING btree ("table_name");