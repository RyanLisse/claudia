-- Initial migration for Claudia database
-- Generated for Neon PostgreSQL with ElectricSQL support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) UNIQUE NOT NULL,
  "name" varchar(255) NOT NULL,
  "avatar_url" text,
  "preferences" jsonb DEFAULT '{"theme":"system","language":"en","timezone":"UTC","notifications":{"email":true,"push":true,"desktop":true}}',
  "is_active" boolean DEFAULT true NOT NULL,
  "last_active_at" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Projects table
CREATE TABLE "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "description" text,
  "path" varchar(1000) NOT NULL,
  "git_url" varchar(500),
  "git_branch" varchar(100) DEFAULT 'main',
  "owner_id" uuid REFERENCES "users"("id") NOT NULL,
  "collaborators" jsonb DEFAULT '[]',
  "settings" jsonb DEFAULT '{"language":"javascript","framework":"react","buildCommand":"npm run build","testCommand":"npm test","lintCommand":"npm run lint","environment":{},"dependencies":[],"devDependencies":[]}',
  "status" varchar(50) DEFAULT 'active',
  "version" varchar(20) DEFAULT '1.0.0',
  "last_build_at" timestamp,
  "total_sessions" integer DEFAULT 0,
  "is_archived" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Agents table
CREATE TABLE "agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(255) NOT NULL,
  "type" varchar(100) NOT NULL,
  "description" text,
  "config" jsonb NOT NULL,
  "created_by" uuid REFERENCES "users"("id") NOT NULL,
  "project_id" uuid REFERENCES "projects"("id"),
  "status" varchar(50) DEFAULT 'inactive',
  "version" varchar(20) DEFAULT '1.0.0',
  "total_runs" integer DEFAULT 0,
  "successful_runs" integer DEFAULT 0,
  "average_run_time" integer DEFAULT 0,
  "last_run_at" timestamp,
  "metrics" jsonb DEFAULT '{"tokensUsed":0,"avgResponseTime":0,"errorRate":0,"userRating":0,"memoryUsage":0,"cpuUsage":0}',
  "is_active" boolean DEFAULT true,
  "is_public" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Sessions table
CREATE TABLE "sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" varchar(255) NOT NULL,
  "description" text,
  "user_id" uuid REFERENCES "users"("id") NOT NULL,
  "project_id" uuid REFERENCES "projects"("id"),
  "agent_id" uuid REFERENCES "agents"("id"),
  "status" varchar(50) DEFAULT 'active',
  "context" jsonb DEFAULT '{"workingDirectory":"","environment":{},"files":[],"currentTask":"","previousTasks":[],"goals":[]}',
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
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Messages table
CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid REFERENCES "sessions"("id") ON DELETE CASCADE NOT NULL,
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
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Memory table
CREATE TABLE "memory" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" varchar(500) NOT NULL,
  "type" varchar(100) NOT NULL,
  "content" jsonb NOT NULL,
  "summary" text,
  "tags" jsonb DEFAULT '[]',
  "user_id" uuid REFERENCES "users"("id"),
  "project_id" uuid REFERENCES "projects"("id"),
  "session_id" uuid REFERENCES "sessions"("id"),
  "importance" integer DEFAULT 1,
  "frequency" integer DEFAULT 1,
  "last_accessed_at" timestamp DEFAULT now(),
  "expires_at" timestamp,
  "version" integer DEFAULT 1,
  "previous_version_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "electric_id" varchar(128) UNIQUE,
  "sync_version" varchar(64) DEFAULT '1',
  "last_sync_at" timestamp
);

-- Sync Events table
CREATE TABLE "sync_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "electric_id" varchar(128) UNIQUE,
  "electric_lsn" varchar(128)
);

-- Sync Conflicts table
CREATE TABLE "sync_conflicts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Sync Metrics table
CREATE TABLE "sync_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for performance
CREATE INDEX "messages_session_idx" ON "messages"("session_id");
CREATE INDEX "messages_sequence_idx" ON "messages"("session_id", "sequence_number");
CREATE INDEX "messages_role_idx" ON "messages"("role");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

CREATE INDEX "memory_key_idx" ON "memory"("key");
CREATE INDEX "memory_type_idx" ON "memory"("type");
CREATE INDEX "memory_user_idx" ON "memory"("user_id");
CREATE INDEX "memory_project_idx" ON "memory"("project_id");
CREATE INDEX "memory_session_idx" ON "memory"("session_id");
CREATE INDEX "memory_importance_idx" ON "memory"("importance");
CREATE INDEX "memory_tags_idx" ON "memory" USING gin("tags");

CREATE INDEX "sync_events_event_type_idx" ON "sync_events"("event_type");
CREATE INDEX "sync_events_table_idx" ON "sync_events"("table_name");
CREATE INDEX "sync_events_record_idx" ON "sync_events"("record_id");
CREATE INDEX "sync_events_status_idx" ON "sync_events"("status");
CREATE INDEX "sync_events_client_idx" ON "sync_events"("client_id");
CREATE INDEX "sync_events_created_at_idx" ON "sync_events"("created_at");

CREATE INDEX "sync_conflicts_table_record_idx" ON "sync_conflicts"("table_name", "record_id");
CREATE INDEX "sync_conflicts_status_idx" ON "sync_conflicts"("is_resolved");
CREATE INDEX "sync_conflicts_client_idx" ON "sync_conflicts"("client_id");
CREATE INDEX "sync_conflicts_created_at_idx" ON "sync_conflicts"("created_at");

CREATE INDEX "sync_metrics_client_metric_idx" ON "sync_metrics"("client_id", "metric_type");
CREATE INDEX "sync_metrics_measured_at_idx" ON "sync_metrics"("measured_at");
CREATE INDEX "sync_metrics_table_idx" ON "sync_metrics"("table_name");

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "projects"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON "agents"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON "sessions"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memory_updated_at BEFORE UPDATE ON "memory"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_conflicts_updated_at BEFORE UPDATE ON "sync_conflicts"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();