import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CoderAgent, CoderAgentConfig, CodeGenerationTask } from '../CoderAgent';
import { AgentStatus, TaskStatus, AgentCapability, AgentType, Priority } from '../../types';

// Mock OpenAI
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(() => ({
    models: {
      list: vi.fn().mockResolvedValue({ data: [] })
    },
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{
            message: {
              content: '```javascript\nfunction hello() {\n  return "Hello, World!";\n}\n```\n\nThis is a simple hello function that returns a greeting message.'
            }
          }],
          usage: {
            total_tokens: 50
          }
        })
      }
    }
  }))
}));

describe('CoderAgent', () => {
  let agent: CoderAgent;
  let mockConfig: CoderAgentConfig;

  beforeEach(() => {
    mockConfig = {
      id: 'test-coder-agent',
      name: 'Test Coder Agent',
      type: AgentType.CODER,
      capabilities: [AgentCapability.CODE_GENERATION],
      maxConcurrentTasks: 2,
      openai: {
        apiKey: 'test-api-key',
        model: 'gpt-4',
        temperature: 0.2,
        maxTokens: 2000,
        streaming: false
      },
      codeGeneration: {
        maxFileSize: 10000,
        supportedLanguages: ['javascript', 'typescript', 'python'],
        includeTests: true,
        includeDocumentation: true
      }
    };

    agent = new CoderAgent(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(agent.id).toBe('test-coder-agent');
      expect(agent.config.type).toBe(AgentType.CODER);
      expect(agent.config.capabilities).toContain(AgentCapability.CODE_GENERATION);
      expect(agent.config.capabilities).toContain(AgentCapability.CODE_REVIEW);
      expect(agent.config.capabilities).toContain(AgentCapability.CODE_ANALYSIS);
    });

    it('should set default values for missing config', () => {
      const minimalConfig: CoderAgentConfig = {
        id: 'minimal-agent',
        name: 'Minimal Agent',
        type: AgentType.CODER,
        capabilities: [],
        maxConcurrentTasks: 1,
        openai: {
          apiKey: 'test-key'
        },
        codeGeneration: {}
      };

      const minimalAgent = new CoderAgent(minimalConfig);
      expect(minimalAgent.config.maxConcurrentTasks).toBe(3);
      expect(minimalAgent.config.description).toContain('AI Agent specialized in code generation');
    });
  });

  describe('Agent Lifecycle', () => {
    it('should start successfully', async () => {
      expect(agent.status).toBe(AgentStatus.OFFLINE);
      
      await agent.start();
      
      expect(agent.status).toBe(AgentStatus.IDLE);
    });

    it('should handle OpenAI connection errors on start', async () => {
      const mockOpenAI = vi.mocked(require('openai').default);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: vi.fn().mockRejectedValue(new Error('API Key invalid'))
        }
      }));

      const failingAgent = new CoderAgent(mockConfig);
      
      await expect(failingAgent.start()).rejects.toThrow('Failed to connect to OpenAI');
    });

    it('should stop successfully', async () => {
      await agent.start();
      await agent.stop();
      
      expect(agent.status).toBe(AgentStatus.OFFLINE);
    });
  });

  describe('Task Validation', () => {
    it('should validate valid code generation task', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function that adds two numbers',
          language: 'javascript'
        }
      };

      const isValid = await agent.validate(task);
      expect(isValid).toBe(true);
    });

    it('should reject task with unsupported type', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'unsupported-type' as any,
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function'
        }
      };

      const isValid = await agent.validate(task);
      expect(isValid).toBe(false);
    });

    it('should reject task without prompt', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: ''
        }
      };

      const isValid = await agent.validate(task);
      expect(isValid).toBe(false);
    });

    it('should reject task with unsupported language', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function',
          language: 'cobol'
        }
      };

      const isValid = await agent.validate(task);
      expect(isValid).toBe(false);
    });

    it('should reject task with code exceeding max file size', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-refactor',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Refactor this code',
          existingCode: 'x'.repeat(20000) // Exceeds maxFileSize of 10000
        }
      };

      const isValid = await agent.validate(task);
      expect(isValid).toBe(false);
    });
  });

  describe('Task Execution', () => {
    it('should execute code generation task successfully', async () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function that adds two numbers',
          language: 'javascript',
          requirements: ['Include error handling', 'Add JSDoc comments']
        }
      };

      await agent.start();
      const result = await agent.execute(task);

      expect(result.code).toContain('function hello()');
      expect(result.explanation).toContain('simple hello function');
      expect(result.metadata.language).toBe('javascript');
      expect(result.metadata.tokensUsed).toBe(50);
      expect(result.metadata.confidence).toBeGreaterThan(0);
    });

    it('should handle streaming responses', async () => {
      const streamingConfig = {
        ...mockConfig,
        openai: {
          ...mockConfig.openai,
          streaming: true
        }
      };

      const streamingAgent = new CoderAgent(streamingConfig);
      
      // Mock streaming response
      const mockOpenAI = vi.mocked(require('openai').default);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: vi.fn().mockResolvedValue({ data: [] })
        },
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              async *[Symbol.asyncIterator]() {
                yield { choices: [{ delta: { content: 'function ' } }] };
                yield { choices: [{ delta: { content: 'hello() {' } }] };
                yield { choices: [{ delta: { content: '\n  return "Hello";' } }] };
                yield { choices: [{ delta: { content: '\n}' } }] };
              }
            })
          }
        }
      }));

      const task: CodeGenerationTask = {
        id: 'streaming-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: streamingAgent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a hello function',
          language: 'javascript'
        }
      };

      await streamingAgent.start();
      const result = await streamingAgent.execute(task);

      expect(result.code).toContain('function hello()');
    });

    it('should execute code review task', async () => {
      const mockOpenAI = vi.mocked(require('openai').default);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: vi.fn().mockResolvedValue({ data: [] })
        },
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: JSON.stringify({
                    code: 'function add(a, b) { return a + b; }',
                    explanation: 'Code looks good overall. Consider adding input validation.',
                    suggestions: ['Add type checking', 'Add JSDoc comments'],
                    issues: ['No input validation'],
                    score: 85
                  })
                }
              }],
              usage: {
                total_tokens: 100
              }
            })
          }
        }
      }));

      const reviewAgent = new CoderAgent(mockConfig);
      
      const task: CodeGenerationTask = {
        id: 'review-task',
        type: 'code-review',
        sessionId: 'test-session',
        agentId: reviewAgent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Review this function',
          existingCode: 'function add(a, b) { return a + b; }',
          language: 'javascript'
        }
      };

      await reviewAgent.start();
      const result = await reviewAgent.execute(task);

      expect(result.code).toContain('function add');
      expect(result.explanation).toContain('Code looks good');
      expect(result.suggestions).toContain('Add type checking');
      expect(result.metadata.confidence).toBe(0.85);
    });

    it('should handle execution errors', async () => {
      const mockOpenAI = vi.mocked(require('openai').default);
      mockOpenAI.mockImplementation(() => ({
        models: {
          list: vi.fn().mockResolvedValue({ data: [] })
        },
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      const failingAgent = new CoderAgent(mockConfig);
      
      const task: CodeGenerationTask = {
        id: 'failing-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: failingAgent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function',
          language: 'javascript'
        }
      };

      await failingAgent.start();
      await expect(failingAgent.execute(task)).rejects.toThrow('API Error');
    });

    it('should emit progress events during execution', async () => {
      const progressEvents: any[] = [];
      
      agent.on('task.progress', (event) => {
        progressEvents.push(event);
      });

      const task: CodeGenerationTask = {
        id: 'progress-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function',
          language: 'javascript'
        }
      };

      await agent.start();
      await agent.execute(task);

      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0].data.status).toBe('starting_generation');
      expect(progressEvents[progressEvents.length - 1].data.status).toBe('completed');
    });
  });

  describe('Task Handling', () => {
    it('should handle code generation tasks', () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-generation',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Create a function'
        }
      };

      expect(agent.canHandle(task)).toBe(true);
    });

    it('should handle code review tasks', () => {
      const task: CodeGenerationTask = {
        id: 'test-task',
        type: 'code-review',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Review this code'
        }
      };

      expect(agent.canHandle(task)).toBe(true);
    });

    it('should not handle unsupported task types', () => {
      const task = {
        id: 'test-task',
        type: 'unsupported-type',
        sessionId: 'test-session',
        agentId: agent.id,
        priority: Priority.NORMAL,
        retries: 0,
        maxRetries: 3,
        timeoutMs: 30000,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        payload: {
          prompt: 'Do something'
        }
      };

      expect(agent.canHandle(task)).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should update configuration', async () => {
      const newConfig = {
        openai: {
          ...mockConfig.openai,
          temperature: 0.5
        }
      };

      await agent.updateConfig(newConfig);

      expect(agent.config.openai.temperature).toBe(0.5);
    });

    it('should maintain configuration on update errors', async () => {
      const originalTemp = agent.config.openai.temperature;
      
      // Mock a config update that throws an error
      const spy = vi.spyOn(agent as any, 'onConfigUpdate').mockRejectedValue(new Error('Config error'));
      
      const newConfig = {
        openai: {
          ...mockConfig.openai,
          temperature: 0.8
        }
      };

      await expect(agent.updateConfig(newConfig)).rejects.toThrow('Config error');
      expect(agent.config.openai.temperature).toBe(originalTemp);
      
      spy.mockRestore();
    });
  });

  describe('Response Parsing', () => {
    it('should parse code blocks correctly', () => {
      const response = '```javascript\nfunction test() {\n  return "test";\n}\n```\n\nThis is a test function.';
      
      const result = (agent as any).parseCodeResponse(response, {
        payload: { language: 'javascript' }
      });

      expect(result.code).toBe('function test() {\n  return "test";\n}');
      expect(result.explanation).toContain('This is a test function');
      expect(result.metadata.language).toBe('javascript');
    });

    it('should handle responses without code blocks', () => {
      const response = 'This is just explanatory text without code.';
      
      const result = (agent as any).parseCodeResponse(response, {
        payload: { language: 'javascript' }
      });

      expect(result.code).toBe(response);
      expect(result.explanation).toBe(response);
    });

    it('should extract suggestions from bulleted lists', () => {
      const response = `Here are some suggestions:
- Add error handling
- Include unit tests
- Improve documentation
* Consider performance optimization`;
      
      const result = (agent as any).parseCodeResponse(response, {
        payload: { language: 'javascript' }
      });

      expect(result.suggestions).toContain('Add error handling');
      expect(result.suggestions).toContain('Include unit tests');
      expect(result.suggestions).toContain('Improve documentation');
      expect(result.suggestions).toContain('Consider performance optimization');
    });
  });
});