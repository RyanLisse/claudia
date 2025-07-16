"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Edit, Trash2, Play, Bot } from "lucide-react";
import { AgentDashboard } from "@/components/agent-dashboard";
import type { AgentMetrics, SwarmMetrics } from "@/types/agent-dashboard";
import { Button } from "@/components/ui/button";
import { api, type Agent } from "@/lib/api-web";
import AgentFormDialog from "@/components/AgentFormDialog";
import AgentExecuteDialog from "@/components/AgentExecuteDialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

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
  const [agentRuns, setAgentRuns] = useState<import("@/lib/api-web").AgentRunWithMetrics[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editAgent, setEditAgent] = useState<Agent | null>(null);
  const [execOpen, setExecOpen] = useState(false);
  const [execAgent, setExecAgent] = useState<Agent | null>(null);
  const originalAgentsRef = useState<Agent[]>([])[0]; // placeholder but we'll keep
  const updateOriginalAgents = (arr: Agent[]) => {
    originalAgentsRef.splice(0, originalAgentsRef.length, ...arr);
  };

  const findOriginalAgent = (idOrName: string): Agent | null => {
    return originalAgentsRef.find(a => a.id?.toString() === idOrName || a.name === idOrName) || null;
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [rawAgents, runs] = await Promise.all([
        api.listAgents(),
        api.listAgentRuns(),
      ]);
      updateOriginalAgents(rawAgents);
      setAgentRuns(runs);
      const metrics = rawAgents.map((a) => mapAgentToMetrics(a)); // we'll refine below
      // compute metrics based on runs
      runs.forEach((run) => {
        const m = metrics.find((mx) => mx.id === (run.agent_id?.toString() || run.agent_name));
        if (m) {
          m.performance.tasksCompleted += 1;
        }
      });
      setAgents(metrics);
      setSwarmMetrics(computeSwarmMetrics(metrics));
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load agents"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openCreate = () => {
    setEditAgent(null);
    setFormOpen(true);
  };
  const openEdit = (agent: Agent) => {
    setEditAgent(agent);
    setFormOpen(true);
  };
  const openExec = (agent: Agent) => {
    setExecAgent(agent);
    setExecOpen(true);
  };
  const handleDelete = async (agent: Agent) => {
    if (!agent.id) return;
    if (!confirm(`Delete agent \"${agent.name}\"?`)) return;
    try {
      await api.deleteAgent(agent.id);
      await loadAll();
    } catch (err) {
      alert("Failed to delete agent");
    }
  };

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
            className="mb-10"
          />
        )}

        {/* Agents Management Grid */}
        {!loading && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-xl">Manage Agents</h2>
              <Button onClick={openCreate} size="sm"><Plus className="mr-1 h-4 w-4"/>New Agent</Button>
            </div>
            {agents.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground"/>
                <p className="text-muted-foreground mb-4">No agents yet.</p>
                <Button onClick={openCreate}>Create your first agent</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agm) => (
                  <Card key={agm.id} className="transition-shadow hover:shadow-lg">
                    <CardContent className="p-4 text-center">
                      <h3 className="font-medium text-lg mb-1">{agm.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2 capitalize">{agm.type}</p>
                      <p className="text-xs text-muted-foreground">Tasks: {agm.performance.tasksCompleted}</p>
                    </CardContent>
                    <CardFooter className="flex justify-center gap-1 p-2">
                      <Button size="sm" variant="ghost" onClick={() => openExec(findOriginalAgent(agm.id))}><Play className="h-3 w-3"/></Button>
                      <Button size="sm" variant="ghost" onClick={() => openEdit(findOriginalAgent(agm.id))}><Edit className="h-3 w-3"/></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(findOriginalAgent(agm.id))}><Trash2 className="h-3 w-3 text-destructive"/></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Dialogs */}
        <AgentFormDialog
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSaved={loadAll}
          agent={editAgent}
        />
        <AgentExecuteDialog
          open={execOpen}
          onClose={() => setExecOpen(false)}
          onExecuted={loadAll}
          agent={execAgent}
        />

      </div>
    </div>
  );
}
