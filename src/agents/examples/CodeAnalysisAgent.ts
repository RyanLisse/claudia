/**
 * Example implementation of a Code Analysis Agent
 */

import { BaseAgent } from '../core/BaseAgent.js';
import type {
  AgentId,
  TaskId,
  Task,
  TaskResult,
  TaskStatus,
  Message,
  AgentConfig,
  AgentCapability
} from '../types/agent.js';
import { messageBroker } from '../communication/MessageBroker.js';

export interface CodeAnalysisTask {
  type: 'code_analysis';
  codeContent: string;
  language: string;
  analysisTypes: ('complexity' | 'security' | 'performance' | 'style')[];
  outputFormat: 'json' | 'text' | 'markdown';
}

export interface CodeAnalysisResult {
  complexity: {
    cyclomaticComplexity: number;
    linesOfCode: number;
    maintainabilityIndex: number;
  };
  security?: {
    vulnerabilities: Array<{
      type: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      line?: number;
    }>;
  };
  performance?: {
    issues: Array<{
      type: string;
      description: string;
      suggestion: string;
      line?: number;
    }>;
  };
  style?: {
    violations: Array<{
      rule: string;
      description: string;
      line?: number;
    }>;
  };
}

/**
 * AI Agent specialized in code analysis tasks
 */
export class CodeAnalysisAgent extends BaseAgent {
  constructor(agentId: AgentId) {
    const config: AgentConfig = {
      id: agentId,
      name: 'Code Analysis Agent',
      description: 'Specialized agent for analyzing code quality, security, and performance',
      capabilities: [
        AgentCapability.CODE_ANALYSIS,
        AgentCapability.SECURITY_AUDIT,
        AgentCapability.PERFORMANCE_OPTIMIZATION
      ],
      maxConcurrentTasks: 3,
      timeoutMs: 120000, // 2 minutes
      retryAttempts: 2,
      metadata: {
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'],
        tags: ['code-quality', 'security', 'performance']
      }
    };

    super(config);
    this.setupMessageHandlers();
  }

  canHandle(task: Task): boolean {
    return task.type === 'code_analysis' && 
           task.requiredCapabilities.includes(AgentCapability.CODE_ANALYSIS);
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      const analysisTask = task.payload as CodeAnalysisTask;
      
      // Validate input
      if (!analysisTask.codeContent || !analysisTask.language) {
        throw new Error('Invalid task payload: missing code content or language');
      }

      this.emit('task.started', { taskId: task.id, agentId: this.id });

      // Perform code analysis
      const result = await this.performCodeAnalysis(analysisTask);
      
      const taskResult: TaskResult = {
        taskId: task.id,
        agentId: this.id,
        status: TaskStatus.COMPLETED,
        result,
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
        metadata: {
          language: analysisTask.language,
          analysisTypes: analysisTask.analysisTypes,
          linesAnalyzed: analysisTask.codeContent.split('\n').length
        }
      };

      this.emit('task.completed', { taskId: task.id, agentId: this.id, result: taskResult });
      return taskResult;

    } catch (error) {
      const taskResult: TaskResult = {
        taskId: task.id,
        agentId: this.id,
        status: TaskStatus.FAILED,
        error: error instanceof Error ? error.message : String(error),
        startedAt: new Date(startTime),
        completedAt: new Date(),
        durationMs: Date.now() - startTime,
      };

      this.emit('task.failed', { taskId: task.id, agentId: this.id, error });
      return taskResult;
    }
  }

  protected async onStart(): Promise<void> {
    console.log(`Code Analysis Agent ${this.id} starting...`);
    
    // Subscribe to relevant message types
    this.subscribe('code.analysis.request', this.handleAnalysisRequest.bind(this));
    this.subscribe('code.review.request', this.handleReviewRequest.bind(this));
  }

  protected async onStop(): Promise<void> {
    console.log(`Code Analysis Agent ${this.id} stopping...`);
    
    // Cleanup any resources
    this.unsubscribe('code.analysis.request');
    this.unsubscribe('code.review.request');
  }

  protected async onSendMessage(message: Message): Promise<void> {
    await messageBroker.sendMessage(message);
  }

  protected async onCancelTask(taskId: TaskId): Promise<void> {
    console.log(`Cancelling task ${taskId} on agent ${this.id}`);
    // Implement task cancellation logic
  }

  private async performCodeAnalysis(task: CodeAnalysisTask): Promise<CodeAnalysisResult> {
    const result: CodeAnalysisResult = {
      complexity: await this.analyzeComplexity(task.codeContent, task.language),
    };

    // Perform requested analysis types
    for (const analysisType of task.analysisTypes) {
      switch (analysisType) {
        case 'security':
          result.security = await this.analyzeSecurityIssues(task.codeContent, task.language);
          break;
        case 'performance':
          result.performance = await this.analyzePerformanceIssues(task.codeContent, task.language);
          break;
        case 'style':
          result.style = await this.analyzeStyleIssues(task.codeContent, task.language);
          break;
      }
    }

    return result;
  }

  private async analyzeComplexity(code: string, language: string): Promise<CodeAnalysisResult['complexity']> {
    // Simulate complexity analysis
    const lines = code.split('\n').filter(line => line.trim().length > 0);
    const functions = this.countFunctions(code, language);
    const branches = this.countBranches(code);
    
    return {
      cyclomaticComplexity: Math.min(branches + 1, 20),
      linesOfCode: lines.length,
      maintainabilityIndex: Math.max(0, 100 - (branches * 2) - (lines.length * 0.1))
    };
  }

  private async analyzeSecurityIssues(code: string, language: string): Promise<NonNullable<CodeAnalysisResult['security']>> {
    const vulnerabilities = [];
    const lines = code.split('\n');

    // Simple pattern-based security checks (in real implementation, use proper AST analysis)
    const securityPatterns = {
      'sql-injection': /eval\(|exec\(|query\(/gi,
      'xss': /innerHTML|document\.write/gi,
      'hardcoded-secret': /(password|secret|key)\s*=\s*["'][^"']+["']/gi,
    };

    for (const [type, pattern] of Object.entries(securityPatterns)) {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          vulnerabilities.push({
            type,
            severity: 'medium' as const,
            description: `Potential ${type.replace('-', ' ')} vulnerability detected`,
            line: index + 1
          });
        }
      });
    }

    return { vulnerabilities };
  }

  private async analyzePerformanceIssues(code: string, language: string): Promise<NonNullable<CodeAnalysisResult['performance']>> {
    const issues = [];
    const lines = code.split('\n');

    // Simple performance checks
    const performancePatterns = {
      'nested-loop': /for\s*\([^)]*\)\s*\{[^}]*for\s*\(/gs,
      'sync-await': /await.*await/g,
      'console-log': /console\.log/g,
    };

    for (const [type, pattern] of Object.entries(performancePatterns)) {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          issues.push({
            type,
            description: `Performance issue: ${type.replace('-', ' ')}`,
            suggestion: this.getPerformanceSuggestion(type),
            line: index + 1
          });
        }
      });
    }

    return { issues };
  }

  private async analyzeStyleIssues(code: string, language: string): Promise<NonNullable<CodeAnalysisResult['style']>> {
    const violations = [];
    const lines = code.split('\n');

    // Simple style checks
    lines.forEach((line, index) => {
      if (line.length > 120) {
        violations.push({
          rule: 'line-length',
          description: 'Line exceeds 120 characters',
          line: index + 1
        });
      }

      if (/\t/.test(line)) {
        violations.push({
          rule: 'no-tabs',
          description: 'Use spaces instead of tabs',
          line: index + 1
        });
      }
    });

    return { violations };
  }

  private countFunctions(code: string, language: string): number {
    const patterns = {
      javascript: /function\s+\w+|=>\s*\{|function\s*\(/g,
      typescript: /function\s+\w+|=>\s*\{|function\s*\(/g,
      python: /def\s+\w+/g,
      java: /(public|private|protected)?\s*(static\s+)?\w+\s+\w+\s*\(/g,
    };

    const pattern = patterns[language as keyof typeof patterns] || patterns.javascript;
    return (code.match(pattern) || []).length;
  }

  private countBranches(code: string): number {
    const branchPatterns = /\bif\b|\belse\b|\bwhile\b|\bfor\b|\bswitch\b|\bcase\b|\btry\b|\bcatch\b/g;
    return (code.match(branchPatterns) || []).length;
  }

  private getPerformanceSuggestion(issueType: string): string {
    const suggestions = {
      'nested-loop': 'Consider optimizing nested loops or using more efficient data structures',
      'sync-await': 'Consider using Promise.all() for parallel async operations',
      'console-log': 'Remove console.log statements in production code',
    };

    return suggestions[issueType as keyof typeof suggestions] || 'Consider optimizing this code pattern';
  }

  private setupMessageHandlers(): void {
    // Set up custom message handlers for this agent type
  }

  private async handleAnalysisRequest(message: Message): Promise<void> {
    // Handle direct analysis requests from other agents
    const { codeContent, language, analysisTypes } = message.payload;
    
    try {
      const result = await this.performCodeAnalysis({
        type: 'code_analysis',
        codeContent,
        language,
        analysisTypes: analysisTypes || ['complexity'],
        outputFormat: 'json'
      });
      
      await this.respond(message.from, message.correlationId!, result);
    } catch (error) {
      await this.respond(message.from, message.correlationId!, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async handleReviewRequest(message: Message): Promise<void> {
    // Handle code review requests
    console.log(`Received code review request from ${message.from}`);
    // Implement code review logic
  }
}

/**
 * Factory function to create code analysis agents
 */
export function createCodeAnalysisAgent(agentId?: AgentId): CodeAnalysisAgent {
  const id = agentId || `code-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return new CodeAnalysisAgent(id);
}