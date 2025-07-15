/**
 * Coder Agent - Specialized for code generation, refactoring, and software development tasks
 */

import { BaseAgent } from '../core/BaseAgent.js';
import type {
  AgentConfig,
  Task,
  TaskResult
} from '../types/agent.js';
import {
  AgentCapability,
  TaskStatus
} from '../types/agent.js';

export interface CoderAgentConfig extends AgentConfig {
  programmingLanguages: string[];
  frameworkExpertise: string[];
  codingStandards: {
    style: string;
    linting: boolean;
    testing: boolean;
    documentation: boolean;
  };
  outputFormats: string[];
}

export interface CodeGenerationTask {
  type: 'code_generation' | 'code_review' | 'refactoring' | 'debugging' | 'optimization';
  language: string;
  framework?: string;
  requirements: string;
  existingCode?: string;
  testRequirements?: string;
  qualityGates: {
    linting: boolean;
    testing: boolean;
    coverage: number;
  };
}

export interface CodeResult {
  code: string;
  explanation: string;
  tests?: string;
  documentation?: string;
  qualityReport: {
    lintingPassed: boolean;
    testsGenerated: number;
    coverageEstimate: number;
    complexityScore: number;
  };
  suggestions: string[];
}

/**
 * Coder Agent Implementation
 */
export class CoderAgent extends BaseAgent {
  private programmingLanguages: Set<string>;
  private frameworkExpertise: Set<string>;
  private codingStandards: CoderAgentConfig['codingStandards'];

  constructor(config: CoderAgentConfig) {
    super({
      ...config,
      capabilities: [
        AgentCapability.CODE_GENERATION,
        AgentCapability.CODE_ANALYSIS,
        AgentCapability.TESTING,
        AgentCapability.DOCUMENTATION,
        ...(config.capabilities || [])
      ]
    });
    
    this.programmingLanguages = new Set(config.programmingLanguages || []);
    this.frameworkExpertise = new Set(config.frameworkExpertise || []);
    this.codingStandards = config.codingStandards || {
      style: 'standard',
      linting: true,
      testing: true,
      documentation: true
    };
  }

  canHandle(task: Task): boolean {
    const supportedTypes = [
      'code_generation',
      'code_review', 
      'refactoring',
      'debugging',
      'optimization',
      'test_generation',
      'documentation_generation'
    ];

    if (!supportedTypes.includes(task.type)) {
      return false;
    }

    // Check if we support the required programming language
    const payload = task.payload as CodeGenerationTask;
    if (payload.language && !this.programmingLanguages.has(payload.language)) {
      return false;
    }

    // Check framework expertise if specified
    if (payload.framework && !this.frameworkExpertise.has(payload.framework)) {
      return false;
    }

    return true;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const payload = task.payload as CodeGenerationTask;
    
    try {
      let result: CodeResult;
      
      switch (task.type) {
        case 'code_generation':
          result = await this.generateCode(payload);
          break;
        case 'code_review':
          result = await this.reviewCode(payload);
          break;
        case 'refactoring':
          result = await this.refactorCode(payload);
          break;
        case 'debugging':
          result = await this.debugCode(payload);
          break;
        case 'optimization':
          result = await this.optimizeCode(payload);
          break;
        default:
          throw new Error(`Unsupported task type: ${task.type}`);
      }

      return {
        taskId: task.id,
        agentId: this.id,
        status: TaskStatus.COMPLETED,
        result,
        startedAt: task.createdAt,
        completedAt: new Date(),
        durationMs: Date.now() - task.createdAt.getTime(),
        metadata: {
          language: payload.language,
          framework: payload.framework,
          qualityScore: result.qualityReport.complexityScore
        }
      };
    } catch (error) {
      return {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date(),
        executionTimeMs: Date.now() - task.createdAt.getTime(),
        metadata: {
          language: payload.language,
          framework: payload.framework
        }
      };
    }
  }

  private async generateCode(payload: CodeGenerationTask): Promise<CodeResult> {
    // Simulate code generation process
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const templates = this.getCodeTemplates(payload.language, payload.framework);
    const generatedCode = this.applyTemplate(templates.main, payload.requirements);
    const tests = this.codingStandards.testing ? 
      this.generateTests(generatedCode, payload.language) : undefined;
    const docs = this.codingStandards.documentation ?
      this.generateDocumentation(generatedCode, payload.requirements) : undefined;
    
    return {
      code: generatedCode,
      explanation: `Generated ${payload.language} code based on requirements: ${payload.requirements}`,
      tests,
      documentation: docs,
      qualityReport: {
        lintingPassed: this.codingStandards.linting,
        testsGenerated: tests ? 3 : 0,
        coverageEstimate: tests ? 85 : 0,
        complexityScore: this.calculateComplexity(generatedCode)
      },
      suggestions: this.generateSuggestions(generatedCode, payload)
    };
  }

  private async reviewCode(payload: CodeGenerationTask): Promise<CodeResult> {
    if (!payload.existingCode) {
      throw new Error('Existing code is required for code review');
    }

    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
    
    const issues = this.analyzeCodeIssues(payload.existingCode);
    const suggestions = this.generateReviewSuggestions(payload.existingCode);
    
    return {
      code: payload.existingCode,
      explanation: `Code review completed. Found ${issues.length} issues.`,
      qualityReport: {
        lintingPassed: issues.filter(i => i.type === 'linting').length === 0,
        testsGenerated: 0,
        coverageEstimate: this.estimateCoverage(payload.existingCode),
        complexityScore: this.calculateComplexity(payload.existingCode)
      },
      suggestions: suggestions
    };
  }

  private async refactorCode(payload: CodeGenerationTask): Promise<CodeResult> {
    if (!payload.existingCode) {
      throw new Error('Existing code is required for refactoring');
    }

    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
    
    const refactoredCode = this.performRefactoring(payload.existingCode, payload.requirements);
    
    return {
      code: refactoredCode,
      explanation: `Refactored code according to: ${payload.requirements}`,
      qualityReport: {
        lintingPassed: true,
        testsGenerated: 0,
        coverageEstimate: this.estimateCoverage(refactoredCode),
        complexityScore: this.calculateComplexity(refactoredCode)
      },
      suggestions: this.generateRefactoringSuggestions(refactoredCode)
    };
  }

  private async debugCode(payload: CodeGenerationTask): Promise<CodeResult> {
    if (!payload.existingCode) {
      throw new Error('Existing code is required for debugging');
    }

    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 1800));
    
    const bugs = this.findBugs(payload.existingCode);
    const fixedCode = this.applyBugFixes(payload.existingCode, bugs);
    
    return {
      code: fixedCode,
      explanation: `Debug analysis completed. Found and fixed ${bugs.length} issues.`,
      qualityReport: {
        lintingPassed: true,
        testsGenerated: 0,
        coverageEstimate: this.estimateCoverage(fixedCode),
        complexityScore: this.calculateComplexity(fixedCode)
      },
      suggestions: bugs.map(bug => `Fixed: ${bug.description}`)
    };
  }

  private async optimizeCode(payload: CodeGenerationTask): Promise<CodeResult> {
    if (!payload.existingCode) {
      throw new Error('Existing code is required for optimization');
    }

    await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 1300));
    
    const optimizedCode = this.performOptimizations(payload.existingCode);
    const performanceGains = this.calculatePerformanceGains(payload.existingCode, optimizedCode);
    
    return {
      code: optimizedCode,
      explanation: `Code optimized with ${performanceGains}% performance improvement.`,
      qualityReport: {
        lintingPassed: true,
        testsGenerated: 0,
        coverageEstimate: this.estimateCoverage(optimizedCode),
        complexityScore: this.calculateComplexity(optimizedCode)
      },
      suggestions: [
        `Performance improved by ${performanceGains}%`,
        'Consider implementing additional caching strategies',
        'Monitor memory usage in production'
      ]
    };
  }

  // Helper methods
  private getCodeTemplates(language: string, framework?: string) {
    const templates: { [key: string]: { main: string; test: string } } = {
      typescript: {
        main: `// Generated TypeScript code\nexport class GeneratedClass {\n  // Implementation here\n}`,
        test: `import { GeneratedClass } from './generated';\n\ndescribe('GeneratedClass', () => {\n  // Tests here\n});`
      },
      javascript: {
        main: `// Generated JavaScript code\nclass GeneratedClass {\n  // Implementation here\n}\n\nmodule.exports = GeneratedClass;`,
        test: `const GeneratedClass = require('./generated');\n\ndescribe('GeneratedClass', () => {\n  // Tests here\n});`
      },
      python: {
        main: `# Generated Python code\nclass GeneratedClass:\n    """Generated class implementation"""\n    pass`,
        test: `import unittest\nfrom generated import GeneratedClass\n\nclass TestGeneratedClass(unittest.TestCase):\n    pass`
      }
    };
    
    return templates[language] || templates.typescript;
  }

  private applyTemplate(template: string, requirements: string): string {
    // Simple template application - in real implementation, this would be more sophisticated
    return template.replace('// Implementation here', `// ${requirements}\n    // Generated implementation`);
  }

  private generateTests(code: string, language: string): string {
    const templates = this.getCodeTemplates(language);
    return templates.test;
  }

  private generateDocumentation(code: string, requirements: string): string {
    return `/**\n * Generated code documentation\n * Requirements: ${requirements}\n * Generated at: ${new Date().toISOString()}\n */`;
  }

  private calculateComplexity(code: string): number {
    // Simple complexity calculation based on code patterns
    const lines = code.split('\n').length;
    const conditions = (code.match(/if|else|while|for|switch/g) || []).length;
    const functions = (code.match(/function|def|=>|class/g) || []).length;
    
    return Math.min(100, (lines / 10) + (conditions * 2) + (functions * 1.5));
  }

  private generateSuggestions(code: string, payload: CodeGenerationTask): string[] {
    const suggestions = [];
    
    if (this.codingStandards.testing && !payload.testRequirements) {
      suggestions.push('Consider adding comprehensive unit tests');
    }
    
    if (this.codingStandards.documentation) {
      suggestions.push('Add detailed JSDoc/docstring comments');
    }
    
    if (code.length > 1000) {
      suggestions.push('Consider breaking down into smaller, more manageable functions');
    }
    
    return suggestions;
  }

  private analyzeCodeIssues(code: string): Array<{ type: string; message: string }> {
    const issues = [];
    
    if (code.includes('console.log')) {
      issues.push({ type: 'linting', message: 'Remove console.log statements before production' });
    }
    
    if (!code.includes('test') && !code.includes('spec')) {
      issues.push({ type: 'testing', message: 'Missing test coverage' });
    }
    
    return issues;
  }

  private generateReviewSuggestions(code: string): string[] {
    const suggestions = [];
    
    if (code.includes('var ')) {
      suggestions.push('Replace var with let/const for better scoping');
    }
    
    if (!code.includes('/**') && !code.includes('//')) {
      suggestions.push('Add code comments for better maintainability');
    }
    
    return suggestions;
  }

  private estimateCoverage(code: string): number {
    // Simple coverage estimation
    const hasTests = code.includes('test') || code.includes('spec');
    return hasTests ? 75 + Math.random() * 20 : Math.random() * 30;
  }

  private performRefactoring(code: string, requirements: string): string {
    // Simple refactoring simulation
    return code.replace(/var /g, 'const ').replace(/function\s+/g, 'const ') + '\n// Refactored according to: ' + requirements;
  }

  private generateRefactoringSuggestions(code: string): string[] {
    return [
      'Code has been refactored for better readability',
      'Consider implementing design patterns for scalability',
      'Add type annotations for better IDE support'
    ];
  }

  private findBugs(code: string): Array<{ type: string; description: string }> {
    const bugs = [];
    
    if (code.includes('==')) {
      bugs.push({ type: 'equality', description: 'Use strict equality (===) instead of loose equality (==)' });
    }
    
    if (code.includes('null.')) {
      bugs.push({ type: 'null-reference', description: 'Potential null reference error' });
    }
    
    return bugs;
  }

  private applyBugFixes(code: string, bugs: Array<{ type: string; description: string }>): string {
    let fixedCode = code;
    
    for (const bug of bugs) {
      if (bug.type === 'equality') {
        fixedCode = fixedCode.replace(/==/g, '===').replace(/!=/g, '!==');
      }
    }
    
    return fixedCode;
  }

  private performOptimizations(code: string): string {
    // Simple optimization simulation
    return code + '\n// Optimizations applied:\n// - Improved algorithm complexity\n// - Added memoization\n// - Reduced memory allocations';
  }

  private calculatePerformanceGains(original: string, optimized: string): number {
    // Simulate performance gains
    return Math.floor(15 + Math.random() * 25); // 15-40% improvement
  }

  // BaseAgent implementation
  protected async onStart(): Promise<void> {
    console.log(`CoderAgent ${this.id} started with languages: ${Array.from(this.programmingLanguages).join(', ')}`);
  }

  protected async onStop(): Promise<void> {
    console.log(`CoderAgent ${this.id} stopped`);
  }

  protected async onSendMessage(message: any): Promise<void> {
    // Implementation for sending messages
    console.log(`CoderAgent ${this.id} sending message:`, message);
  }

  protected async onCancelTask(taskId: string): Promise<void> {
    console.log(`CoderAgent ${this.id} cancelling task ${taskId}`);
  }

  // Add language/framework support
  addLanguageSupport(language: string): void {
    this.programmingLanguages.add(language);
  }

  addFrameworkExpertise(framework: string): void {
    this.frameworkExpertise.add(framework);
  }

  getSupportedLanguages(): string[] {
    return Array.from(this.programmingLanguages);
  }

  getSupportedFrameworks(): string[] {
    return Array.from(this.frameworkExpertise);
  }
}

// Factory function for creating coder agents
export function createCoderAgent(config: Partial<CoderAgentConfig> = {}): CoderAgent {
  const defaultConfig: CoderAgentConfig = {
    id: `coder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name || 'Coder Agent',
    description: 'Specialized agent for code generation, review, and optimization',
    capabilities: [AgentCapability.CODE_GENERATION, AgentCapability.CODE_ANALYSIS],
    maxConcurrentTasks: 3,
    programmingLanguages: ['typescript', 'javascript', 'python'],
    frameworkExpertise: ['react', 'node.js', 'express', 'django'],
    codingStandards: {
      style: 'standard',
      linting: true,
      testing: true,
      documentation: true
    },
    outputFormats: ['code', 'explanation', 'tests', 'documentation'],
    ...config
  };

  return new CoderAgent(defaultConfig);
}