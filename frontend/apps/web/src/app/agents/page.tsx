"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { AgentDashboard } from "@/components/agent-dashboard";
import type { AgentMetrics, SwarmMetrics } from "@/types/agent-dashboard";
import { Button } from "@/components/ui/button";
import { api, type Agent } from "@/lib/api-web";

// Utility helpers -----------------------------------------------------------

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const mapAgentToMetrics = (agent: Agent): AgentMetrics => {
  // Generate mock metrics for display purposes
  const statusOptions: AgentMetrics["status"][] = [
    "active",
    "idle",
    "busy",
    "error",
  ];
  const status = statusOptions[randomInt(0, statusOptions.length - 1)];

  return {
    id: agent.id ? agent.id.toString() : agent.name,
    name: agent.name,
    type: "coder", // Default type for now – could be derived from agent meta
    status,
    currentTask:
      status === "active" || status === "busy"
        ? agent.default_task || "Running task"
        : undefined,
    performance: {
      tasksCompleted: randomInt(5, 40),
      successRate: randomInt(75, 99),
      avgResponseTime: randomInt(120, 600),
      cpuUsage: randomInt(10, 90),
      memoryUsage: randomInt(10, 90),
    },
    capabilities: (agent.description ?? "")
      .split(/[,\.]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6),
    lastActivity: new Date(Date.now() - randomInt(1, 7200) * 1000),
    uptime: randomInt(600, 72000),
    connectionQuality: "good",
  };
};

const computeSwarmMetrics = (agents: AgentMetrics[]): SwarmMetrics => {
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === "active").length;
  const totalTasks = agents.reduce((acc, a) => acc + a.performance.tasksCompleted, 0);
  const completedTasks = totalTasks; // All mock tasks considered completed
  const avgPerformance =
    agents.length > 0
      ? Math.round(
          agents.reduce((acc, a) => acc + a.performance.successRate, 0) / agents.length,
        )
      : 0;

  return {
    totalAgents,
    activeAgents,
    totalTasks,
    completedTasks,
    avgPerformance,
    networkLatency: randomInt(30, 120),
    coordinationEfficiency: avgPerformance,
  };
};

// ---------------------------------------------------------------------------

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentMetrics[]>([]);
  const [swarmMetrics, setSwarmMetrics] = useState<SwarmMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawAgents = await api.listAgents();
        const metrics = rawAgents.map(mapAgentToMetrics);
        setAgents(metrics);
        setSwarmMetrics(computeSwarmMetrics(metrics));
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to load agents"));
      } finally {
        setLoading(false);
      }
    };

    loadAgents();
  }, []);

  const handleAgentAction = (agentId: string, action: "start" | "pause" | "stop" | "configure") => {
    // Placeholder implementation – integrate real API once available
    console.log(`Agent action: ${action} on ${agentId}`);
  };

  // UI ---------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <button
            onClick={() => (window.location.href = "/")}
            className="mb-4 text-muted-foreground text-sm transition-colors hover:text-foreground"
          >
            ← Back to Home
          </button>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="font-bold text-3xl tracking-tight">CC Agents</h1>
              <p className="mt-1 text-muted-foreground text-sm">
                Manage and monitor your Claude Code agents
              </p>
            </div>
            <Button
              onClick={() => alert("Agent creation coming soon!")}
              size="default"
              className="hidden sm:inline-flex"
            >
              <Plus className="mr-2 h-4 w-4" /> New Agent
            </Button>
          </div>
        </motion.div>

        {/* Error display */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 max-w-2xl rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive text-xs"
          >
            {error.message}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Dashboard */}
        {!loading && swarmMetrics && (
          <AgentDashboard
            agents={agents}
            swarmMetrics={swarmMetrics}
            onAgentAction={handleAgentAction}
          />
        )}

        {/* Empty state */}
        {!loading && agents.length === 0 && !error && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground text-sm mb-4">No agents found.</p>
            <Button onClick={() => alert("Agent creation coming soon!")}>Create your first agent</Button>
          </div>
        )}
      </div>
    </div>
  );
}
