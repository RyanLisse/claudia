# AI Agent System Usage Examples

This document provides comprehensive examples of how to use the AI Agent System within Claudia.

## Basic Setup

```typescript
import {
  initializeAgentSystem,
  setupCommonAgents,
  submitCodeAnalysisTask,
  AgentCapability,
  Priority
} from '@/agents/utils';

// Initialize the agent system
const { orchestrator, registry, monitor, messageBroker } = await initializeAgentSystem({
  maxAgents: 10,
  taskQueueSize: 1000,
  heartbeatIntervalMs: 30000,
});

// Setup common agents
const { codeAnalysisAgent } = await setupCommonAgents();

console.log('AI Agent System initialized with agents:', {
  codeAnalysisAgent: codeAnalysisAgent.id
});
```

## Code Analysis Examples

### Basic Code Analysis

```typescript
// Submit a code analysis task
const taskId = await submitCodeAnalysisTask(
  `
  function calculateTotal(items) {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += items[i].price * items[i].quantity;
    }
    return total;
  }
  `,
  'javascript',
  ['complexity', 'performance', 'style']
);

console.log('Code analysis task submitted:', taskId);

// Wait for results
const result = await orchestrator.getTaskResult(taskId);
if (result) {
  console.log('Analysis complete:', result.result);
}
```

### Advanced Code Analysis with Security Check

```typescript
const securityTaskId = await submitCodeAnalysisTask(
  `
  const express = require('express');
  const app = express();
  
  app.get('/user/:id', (req, res) => {
    const query = "SELECT * FROM users WHERE id = " + req.params.id;
    db.query(query, (err, results) => {
      res.send(results);
    });
  });
  `,
  'javascript',
  ['security', 'complexity']
);

const securityResult = await orchestrator.getTaskResult(securityTaskId);
console.log('Security analysis:', securityResult?.result.security);
```

## Custom Agent Implementation

### Creating a Testing Agent

```typescript
import { BaseAgent } from '@/agents/core/BaseAgent';
import { AgentCapability, AgentConfig, Task, TaskResult, TaskStatus } from '@/agents/types/agent';

class TestingAgent extends BaseAgent {
  constructor(agentId: string) {
    const config: AgentConfig = {
      id: agentId,
      name: 'Testing Agent',
      description: 'Specialized agent for running tests and generating test cases',
      capabilities: [AgentCapability.TESTING, AgentCapability.CODE_ANALYSIS],
      maxConcurrentTasks: 2,
      timeoutMs: 180000, // 3 minutes
      retryAttempts: 2,
    };
    super(config);
  }

  canHandle(task: Task): boolean {
    return task.type === 'run_tests' || task.type === 'generate_tests';
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      let result;
      
      if (task.type === 'run_tests') {
        result = await this.runTests(task.payload);
      } else if (task.type === 'generate_tests') {
        result = await this.generateTests(task.payload);
      } else {
        throw new Error(`Unsupported task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: TaskStatus.COMPLETED,
        result,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        taskId: task.id,
        agentId: this.id,
        status: TaskStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  private async runTests(payload: any): Promise<any> {
    // Implement test execution logic
    return {
      testsRun: 10,
      passed: 8,
      failed: 2,
      coverage: 85,
      duration: 2500
    };
  }

  private async generateTests(payload: any): Promise<any> {
    // Implement test generation logic
    return {
      testsGenerated: 15,
      testCoverage: 90,
      testTypes: ['unit', 'integration']
    };
  }

  protected async onStart(): Promise<void> {
    console.log(`Testing Agent ${this.id} started`);
  }

  protected async onStop(): Promise<void> {
    console.log(`Testing Agent ${this.id} stopped`);
  }

  protected async onSendMessage(): Promise<void> {
    // Implementation depends on your message broker
  }

  protected async onCancelTask(): Promise<void> {
    console.log('Test execution cancelled');
  }
}

// Register and use the testing agent
const testingAgent = new TestingAgent('testing-agent-1');
await testingAgent.start();
await registry.register(testingAgent);
```

## Multi-Agent Workflows

### Coordinated Code Review Workflow

```typescript
// Submit multiple related tasks that will be processed by different agents
const tasks = await Promise.all([
  // Code analysis
  orchestrator.submitTask({
    type: 'code_analysis',
    priority: Priority.HIGH,
    payload: {
      codeContent: sourceCode,
      language: 'typescript',
      analysisTypes: ['complexity', 'security', 'performance']
    },
    requiredCapabilities: [AgentCapability.CODE_ANALYSIS]
  }),
  
  // Test generation
  orchestrator.submitTask({
    type: 'generate_tests',
    priority: Priority.NORMAL,
    payload: {
      codeContent: sourceCode,
      language: 'typescript',
      testType: 'unit'
    },
    requiredCapabilities: [AgentCapability.TESTING]
  }),
  
  // Documentation generation
  orchestrator.submitTask({
    type: 'generate_docs',
    priority: Priority.LOW,
    payload: {
      codeContent: sourceCode,
      language: 'typescript',
      format: 'markdown'
    },
    requiredCapabilities: [AgentCapability.DOCUMENTATION]
  })
]);

console.log('Submitted workflow tasks:', tasks);

// Monitor progress
for (const taskId of tasks) {
  const result = await orchestrator.getTaskResult(taskId);
  if (result) {
    console.log(`Task ${taskId} completed:`, result.result);
  }
}
```

## Monitoring and Management

### Real-time System Monitoring

```typescript
import { agentMonitor } from '@/agents/utils';

// Subscribe to agent metrics updates
agentMonitor.subscribeToMetrics('code-analysis-agent-1', (metrics) => {
  console.log('Agent metrics updated:', {
    tasksCompleted: metrics.tasksCompleted,
    averageDuration: metrics.averageTaskDurationMs,
    successRate: metrics.tasksCompleted / (metrics.tasksCompleted + metrics.tasksFailed)
  });
});

// Get system health
const health = await agentMonitor.getHealthStatus();
console.log('System health:', health);

// Get performance dashboard data
const dashboard = agentMonitor.getDashboardData();
console.log('Dashboard data:', {
  totalAgents: dashboard.systemMetrics.totalAgents,
  activeAgents: dashboard.systemMetrics.activeAgents,
  topPerformers: dashboard.topPerformers,
  bottlenecks: dashboard.bottlenecks
});
```

### Custom Alert Rules

```typescript
// Add custom alert rule
agentMonitor.addAlertRule({
  id: 'custom-performance-alert',
  name: 'Custom Performance Alert',
  condition: (metrics, systemMetrics) => {
    return metrics.averageTaskDurationMs > 30000 && // > 30 seconds
           metrics.tasksCompleted > 5; // Only alert for agents with some activity
  },
  severity: 'medium',
  message: 'Agent is experiencing slow performance',
  cooldownMs: 300000, // 5 minutes
  enabled: true,
});

// Listen for alerts
agentMonitor.on('alert.triggered', (alert) => {
  console.log('Alert triggered:', {
    agent: alert.agentId,
    rule: alert.ruleId,
    severity: alert.severity,
    message: alert.message
  });
  
  // Send notification, log to external system, etc.
});
```

## Inter-Agent Communication

### Direct Messaging

```typescript
import { messageBroker } from '@/agents/utils';

// Register agents for messaging
messageBroker.registerAgent('agent-1');
messageBroker.registerAgent('agent-2');

// Subscribe to message types
messageBroker.subscribe('agent-2', 'analysis.request');

// Send direct message
await messageBroker.sendMessage({
  id: 'msg-1',
  from: 'agent-1',
  to: 'agent-2',
  type: 'analysis.request',
  payload: {
    codeContent: 'function example() { return true; }',
    urgency: 'high'
  },
  priority: Priority.HIGH,
  timestamp: new Date()
});

// Get messages for an agent
const messages = messageBroker.getMessages('agent-2');
console.log('Received messages:', messages);
```

### Broadcast Communication

```typescript
// Broadcast system-wide message
await messageBroker.sendMessage({
  id: 'broadcast-1',
  from: 'system',
  to: 'broadcast',
  type: 'system.maintenance',
  payload: {
    message: 'System maintenance starting in 10 minutes',
    scheduledTime: new Date(Date.now() + 600000).toISOString()
  },
  priority: Priority.CRITICAL,
  timestamp: new Date()
});
```

## Error Handling and Recovery

### Task Retry Configuration

```typescript
// Submit task with custom retry configuration
const taskId = await orchestrator.submitTask({
  type: 'complex_analysis',
  priority: Priority.HIGH,
  payload: { data: complexData },
  requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
  maxRetries: 5, // Allow up to 5 retries
  timeoutMs: 600000, // 10 minutes timeout
});

// Monitor task status
const checkTaskStatus = async (taskId: string) => {
  const result = await orchestrator.getTaskResult(taskId);
  
  if (!result) {
    console.log('Task still pending...');
    return;
  }
  
  if (result.status === TaskStatus.COMPLETED) {
    console.log('Task completed successfully:', result.result);
  } else if (result.status === TaskStatus.FAILED) {
    console.log('Task failed:', result.error);
    
    // Optionally resubmit with different parameters
    const retryTaskId = await orchestrator.submitTask({
      type: 'complex_analysis',
      priority: Priority.NORMAL,
      payload: { ...complexData, retryMode: true },
      requiredCapabilities: [AgentCapability.CODE_ANALYSIS],
      maxRetries: 2,
      timeoutMs: 300000,
    });
    
    console.log('Retry task submitted:', retryTaskId);
  }
};
```

## Performance Optimization

### Agent Scaling

```typescript
// Monitor system load and scale accordingly
const monitorAndScale = async () => {
  const stats = orchestrator.getStats();
  const queueSize = stats.queueSize;
  const activeAgents = stats.activeAgents;
  
  // Scale up if queue is getting large
  if (queueSize > 50 && activeAgents < 10) {
    await orchestrator.scaleAgents(activeAgents + 2);
    console.log('Scaled up agents due to high queue size');
  }
  
  // Scale down if system is idle
  if (queueSize < 5 && activeAgents > 3) {
    await orchestrator.scaleAgents(Math.max(3, activeAgents - 1));
    console.log('Scaled down agents due to low load');
  }
};

// Run scaling check every minute
setInterval(monitorAndScale, 60000);
```

### Task Prioritization

```typescript
// Submit tasks with different priorities
const criticalTask = await orchestrator.submitTask({
  type: 'security_scan',
  priority: Priority.CRITICAL, // Will be processed first
  payload: { target: 'production-code' },
  requiredCapabilities: [AgentCapability.SECURITY_AUDIT]
});

const normalTask = await orchestrator.submitTask({
  type: 'code_analysis',
  priority: Priority.NORMAL,
  payload: { code: regularCode },
  requiredCapabilities: [AgentCapability.CODE_ANALYSIS]
});

const backgroundTask = await orchestrator.submitTask({
  type: 'generate_docs',
  priority: Priority.LOW, // Will be processed last
  payload: { code: documentationCode },
  requiredCapabilities: [AgentCapability.DOCUMENTATION]
});
```

## Integration with Existing Claudia Features

### Using with Claude Code Sessions

```typescript
// Example of integrating agent system with existing Claudia functionality
const analyzeClaudeSession = async (sessionOutput: string) => {
  // Extract code from Claude session output
  const codeBlocks = extractCodeBlocks(sessionOutput);
  
  const analysisPromises = codeBlocks.map(async (codeBlock) => {
    const taskId = await submitCodeAnalysisTask(
      codeBlock.content,
      codeBlock.language,
      ['complexity', 'security', 'style']
    );
    
    return {
      block: codeBlock,
      taskId,
      analysis: await orchestrator.getTaskResult(taskId)
    };
  });
  
  const results = await Promise.all(analysisPromises);
  
  // Generate summary report
  const report = {
    totalBlocks: results.length,
    securityIssues: results.flatMap(r => r.analysis?.result?.security?.vulnerabilities || []),
    complexityScores: results.map(r => r.analysis?.result?.complexity?.cyclomaticComplexity || 0),
    styleViolations: results.flatMap(r => r.analysis?.result?.style?.violations || [])
  };
  
  return report;
};

function extractCodeBlocks(content: string): Array<{content: string, language: string}> {
  // Implementation to extract code blocks from Claude session output
  return [];
}
```

## Cleanup and Shutdown

```typescript
// Graceful shutdown
const shutdownGracefully = async () => {
  console.log('Shutting down AI Agent System...');
  
  // Stop accepting new tasks
  const status = await orchestrator.getStatus();
  console.log('Current status:', status);
  
  // Wait for current tasks to complete (with timeout)
  const maxWaitTime = 60000; // 1 minute
  const startTime = Date.now();
  
  while (status.tasksInProgress > 0 && (Date.now() - startTime) < maxWaitTime) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const currentStatus = await orchestrator.getStatus();
    console.log('Waiting for tasks to complete:', currentStatus.tasksInProgress);
  }
  
  // Shutdown the system
  await orchestrator.shutdown();
  console.log('AI Agent System shut down successfully');
};

// Handle graceful shutdown on process termination
process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);
```

This usage guide provides comprehensive examples of how to use the AI Agent System in various scenarios within the Claudia application. The system is designed to be flexible and extensible, allowing for custom agent implementations and workflows.