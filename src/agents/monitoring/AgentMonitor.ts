/**
 * Agent monitoring and performance tracking system
 */

import { EventEmitter } from 'events';
import type {
  AgentId,
  AgentMetrics,
  AgentStatus,
  TaskId
} from '../types/agent.js';
import type { IAgentMonitor } from '../interfaces/IAgent.js';
import { inngest } from '../inngest/client.js';

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: AgentMetrics, systemMetrics: SystemMetrics) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  cooldownMs: number;
  enabled: boolean;
}

export interface SystemMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  averageResponseTime: number;
  queueSize: number;
  systemLoad: number;
  memoryUsage: number;
}

export interface PerformanceData {
  agentId: AgentId;
  timestamp: Date;
  metrics: AgentMetrics;
  responseTime: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * Comprehensive agent monitoring system
 */
export class AgentMonitor extends EventEmitter implements IAgentMonitor {
  private monitoredAgents: Set<AgentId> = new Set();
  private metricsHistory: Map<AgentId, PerformanceData[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private systemMetrics: SystemMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private maxHistorySize = 1000;
  private monitoringIntervalMs = 30000; // 30 seconds
  private healthCheckIntervalMs = 60000; // 1 minute

  constructor() {
    super();
    this.systemMetrics = this.initializeSystemMetrics();
    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  async startMonitoring(agentId: AgentId): Promise<void> {
    this.monitoredAgents.add(agentId);
    
    if (!this.metricsHistory.has(agentId)) {
      this.metricsHistory.set(agentId, []);
    }

    this.emit('monitoring.started', { agentId });
    
    // Send monitoring event to Inngest
    await inngest.send({
      name: 'agent/monitoring.started',
      data: {
        agentId,
        timestamp: new Date().toISOString(),
      }
    });
  }

  async stopMonitoring(agentId: AgentId): Promise<void> {
    this.monitoredAgents.delete(agentId);
    this.emit('monitoring.stopped', { agentId });
    
    await inngest.send({
      name: 'agent/monitoring.stopped',
      data: {
        agentId,
        timestamp: new Date().toISOString(),
      }
    });
  }

  async getMetrics(agentId: AgentId): Promise<AgentMetrics> {
    const history = this.metricsHistory.get(agentId) || [];
    if (history.length === 0) {
      throw new Error(`No metrics available for agent ${agentId}`);
    }

    return history[history.length - 1].metrics;
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    return { ...this.systemMetrics };
  }

  subscribeToMetrics(agentId: AgentId, callback: (metrics: AgentMetrics) => void): void {
    this.on(`metrics.${agentId}`, callback);
  }

  async getHealthStatus(): Promise<Record<AgentId, boolean>> {
    const healthStatus: Record<AgentId, boolean> = {};
    
    for (const agentId of this.monitoredAgents) {
      try {
        // Check if we've received recent metrics
        const history = this.metricsHistory.get(agentId) || [];
        const lastMetrics = history[history.length - 1];
        
        if (!lastMetrics) {
          healthStatus[agentId] = false;
          continue;
        }

        // Consider agent healthy if last heartbeat was within 2 minutes
        const timeSinceLastHeartbeat = Date.now() - lastMetrics.timestamp.getTime();
        healthStatus[agentId] = timeSinceLastHeartbeat < 120000;
      } catch (error) {
        healthStatus[agentId] = false;
      }
    }
    
    return healthStatus;
  }

  /**
   * Record metrics for an agent
   */
  recordMetrics(agentId: AgentId, metrics: AgentMetrics, responseTime: number = 0): void {
    const performanceData: PerformanceData = {
      agentId,
      timestamp: new Date(),
      metrics,
      responseTime,
      memoryUsage: metrics.memoryUsage,
      cpuUsage: metrics.cpuUsage,
    };

    let history = this.metricsHistory.get(agentId) || [];
    history.push(performanceData);

    // Maintain history size limit
    if (history.length > this.maxHistorySize) {
      history = history.slice(-this.maxHistorySize);
    }

    this.metricsHistory.set(agentId, history);
    this.emit(`metrics.${agentId}`, metrics);
    this.emit('metrics.recorded', { agentId, metrics });

    // Check alert rules
    this.checkAlertRules(agentId, metrics);
  }

  /**
   * Get performance history for an agent
   */
  getPerformanceHistory(agentId: AgentId, limit: number = 100): PerformanceData[] {
    const history = this.metricsHistory.get(agentId) || [];
    return history.slice(-limit);
  }

  /**
   * Get aggregated metrics over a time period
   */
  getAggregatedMetrics(agentId: AgentId, periodMs: number): {
    averageResponseTime: number;
    tasksCompleted: number;
    tasksFailed: number;
    successRate: number;
    averageTaskDuration: number;
  } {
    const cutoff = Date.now() - periodMs;
    const history = this.metricsHistory.get(agentId) || [];
    const recentData = history.filter(data => data.timestamp.getTime() >= cutoff);

    if (recentData.length === 0) {
      return {
        averageResponseTime: 0,
        tasksCompleted: 0,
        tasksFailed: 0,
        successRate: 0,
        averageTaskDuration: 0,
      };
    }

    const totalResponseTime = recentData.reduce((sum, data) => sum + data.responseTime, 0);
    const latest = recentData[recentData.length - 1].metrics;
    const oldest = recentData[0].metrics;

    const tasksCompleted = latest.tasksCompleted - oldest.tasksCompleted;
    const tasksFailed = latest.tasksFailed - oldest.tasksFailed;
    const totalTasks = tasksCompleted + tasksFailed;

    return {
      averageResponseTime: totalResponseTime / recentData.length,
      tasksCompleted,
      tasksFailed,
      successRate: totalTasks > 0 ? tasksCompleted / totalTasks : 0,
      averageTaskDuration: latest.averageTaskDurationMs,
    };
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('alert.rule.added', { rule });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    this.alertCooldowns.delete(ruleId);
    this.emit('alert.rule.removed', { ruleId });
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics(metrics: Partial<SystemMetrics>): void {
    Object.assign(this.systemMetrics, metrics);
    this.emit('system.metrics.updated', this.systemMetrics);
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData(): {
    systemMetrics: SystemMetrics;
    agentMetrics: Record<AgentId, AgentMetrics>;
    recentAlerts: any[];
    topPerformers: AgentId[];
    bottlenecks: AgentId[];
  } {
    const agentMetrics: Record<AgentId, AgentMetrics> = {};
    const performanceRatings: Array<{ agentId: AgentId; score: number }> = [];

    for (const agentId of this.monitoredAgents) {
      const history = this.metricsHistory.get(agentId) || [];
      if (history.length > 0) {
        const latest = history[history.length - 1];
        agentMetrics[agentId] = latest.metrics;

        // Calculate performance score (lower is better)
        const score = (latest.metrics.tasksFailed * 10) + 
                     (latest.metrics.averageTaskDurationMs / 1000) + 
                     (latest.responseTime / 100);
        performanceRatings.push({ agentId, score });
      }
    }

    performanceRatings.sort((a, b) => a.score - b.score);

    return {
      systemMetrics: this.systemMetrics,
      agentMetrics,
      recentAlerts: [], // TODO: Implement alert history
      topPerformers: performanceRatings.slice(0, 5).map(p => p.agentId),
      bottlenecks: performanceRatings.slice(-5).reverse().map(p => p.agentId),
    };
  }

  /**
   * Export metrics data
   */
  exportMetrics(agentId?: AgentId): any {
    if (agentId) {
      return {
        agentId,
        history: this.metricsHistory.get(agentId) || [],
        aggregated: this.getAggregatedMetrics(agentId, 3600000), // Last hour
      };
    }

    const allData: any = {
      systemMetrics: this.systemMetrics,
      agents: {},
      exportedAt: new Date().toISOString(),
    };

    for (const agentId of this.monitoredAgents) {
      allData.agents[agentId] = {
        history: this.metricsHistory.get(agentId) || [],
        aggregated: this.getAggregatedMetrics(agentId, 3600000),
      };
    }

    return allData;
  }

  /**
   * Cleanup old data
   */
  cleanup(olderThanMs: number = 86400000): void { // Default 24 hours
    const cutoff = Date.now() - olderThanMs;

    for (const [agentId, history] of this.metricsHistory) {
      const filtered = history.filter(data => data.timestamp.getTime() >= cutoff);
      if (filtered.length !== history.length) {
        this.metricsHistory.set(agentId, filtered);
      }
    }

    this.emit('cleanup.completed', { cutoff: new Date(cutoff) });
  }

  private initializeSystemMetrics(): SystemMetrics {
    return {
      totalAgents: 0,
      activeAgents: 0,
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      queueSize: 0,
      systemLoad: 0,
      memoryUsage: 0,
    };
  }

  private setupDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-failure-rate',
        name: 'High Failure Rate',
        condition: (metrics) => {
          const total = metrics.tasksCompleted + metrics.tasksFailed;
          return total > 10 && (metrics.tasksFailed / total) > 0.2;
        },
        severity: 'high',
        message: 'Agent has high task failure rate (>20%)',
        cooldownMs: 300000, // 5 minutes
        enabled: true,
      },
      {
        id: 'slow-response',
        name: 'Slow Response Time',
        condition: (metrics) => metrics.averageTaskDurationMs > 60000,
        severity: 'medium',
        message: 'Agent response time is slow (>60s average)',
        cooldownMs: 300000,
        enabled: true,
      },
      {
        id: 'agent-offline',
        name: 'Agent Offline',
        condition: (metrics) => {
          const timeSinceLastActive = Date.now() - metrics.lastActiveAt.getTime();
          return timeSinceLastActive > 120000; // 2 minutes
        },
        severity: 'critical',
        message: 'Agent appears to be offline',
        cooldownMs: 60000, // 1 minute
        enabled: true,
      },
    ];

    for (const rule of defaultRules) {
      this.addAlertRule(rule);
    }
  }

  private async checkAlertRules(agentId: AgentId, metrics: AgentMetrics): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(`${ruleId}:${agentId}`);
      if (lastAlert && Date.now() - lastAlert.getTime() < rule.cooldownMs) {
        continue;
      }

      // Check condition
      if (rule.condition(metrics, this.systemMetrics)) {
        this.alertCooldowns.set(`${ruleId}:${agentId}`, new Date());
        
        const alert = {
          ruleId,
          agentId,
          severity: rule.severity,
          message: rule.message,
          timestamp: new Date(),
          metrics,
        };

        this.emit('alert.triggered', alert);

        // Send alert to Inngest
        await inngest.send({
          name: 'agent/monitoring.alert',
          data: {
            alertType: ruleId as any,
            agentId,
            severity: rule.severity,
            message: rule.message,
            metadata: { metrics, rule },
            timestamp: new Date().toISOString(),
          }
        });
      }
    }
  }

  private startMonitoring(): void {
    // Start periodic system metrics collection
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.monitoringIntervalMs);

    // Start health check interval
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.healthCheckIntervalMs);
  }

  private collectSystemMetrics(): void {
    // This would integrate with actual system monitoring
    const updatedMetrics: Partial<SystemMetrics> = {
      totalAgents: this.monitoredAgents.size,
      activeAgents: this.monitoredAgents.size, // Simplified
      systemLoad: Math.random() * 100, // Mock data
      memoryUsage: Math.random() * 100, // Mock data
    };

    this.updateSystemMetrics(updatedMetrics);
  }

  private async performHealthChecks(): Promise<void> {
    const healthStatus = await this.getHealthStatus();
    
    for (const [agentId, isHealthy] of Object.entries(healthStatus)) {
      if (!isHealthy) {
        this.emit('agent.unhealthy', { agentId });
      }
    }
  }

  /**
   * Shutdown monitoring
   */
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.removeAllListeners();
  }
}

/**
 * Singleton monitor instance
 */
export const agentMonitor = new AgentMonitor();