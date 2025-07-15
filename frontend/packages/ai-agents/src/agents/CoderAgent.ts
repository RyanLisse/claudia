import OpenAI from 'openai';
import { BaseAgent } from '../base/BaseAgent';
import type {
  AgentTask,
  AgentConfig,
  Message,
  TaskStatus,
  AgentCapability,
  AgentType,
  Priority
} from '../types';

export interface CoderAgentConfig extends AgentConfig {
  openai: {
    apiKey: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    streaming?: boolean;
  };
  codeGeneration: {
    maxFileSize?: number;
    supportedLanguages?: string[];
    includeTests?: boolean;
    includeDocumentation?: boolean;
  };
}

export interface CodeGenerationTask extends AgentTask {
  type: 'code-generation' | 'code-review' | 'code-refactor' | 'code-debug' | 'code-test';
  payload: {
    prompt: string;
    language?: string;
    framework?: string;
    requirements?: string[];
    existingCode?: string;
    testRequirements?: string[];
    context?: {
      projectType?: string;
      dependencies?: string[];
      codeStyle?: string;
    };
  };
}

export interface CodeGenerationResult {
  code: string;
  explanation: string;
  tests?: string;
  documentation?: string;
  suggestions?: string[];
  metadata: {
    language: string;
    framework?: string;
    tokensUsed: number;
    generationTime: number;
    confidence: number;
  };
}

/**
 * CoderAgent - AI Agent specialized in code generation using OpenAI
 */
export class CoderAgent extends BaseAgent {
  private openai: OpenAI;
  private readonly coderConfig: CoderAgentConfig;

  constructor(config: CoderAgentConfig) {
    // Ensure coder-specific capabilities
    const coderCapabilities: AgentCapability[] = [
      AgentCapability.CODE_GENERATION,
      AgentCapability.CODE_REVIEW,
      AgentCapability.CODE_ANALYSIS,
      AgentCapability.TESTING,
      AgentCapability.DOCUMENTATION
    ];

    const enhancedConfig: CoderAgentConfig = {
      ...config,
      type: AgentType.CODER,
      capabilities: [...(config.capabilities || []), ...coderCapabilities],
      maxConcurrentTasks: config.maxConcurrentTasks || 3,
      description: config.description || 'AI Agent specialized in code generation and programming tasks'
    };

    super(enhancedConfig);
    this.coderConfig = enhancedConfig;
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  protected async onStart(): Promise<void> {
    // Test OpenAI connection
    try {
      await this.openai.models.list();
      console.log(`CoderAgent ${this.id} connected to OpenAI successfully`);
    } catch (error) {
      throw new Error(`Failed to connect to OpenAI: ${error}`);
    }
  }

  protected async onStop(): Promise<void> {
    // Clean up any ongoing streaming operations
    console.log(`CoderAgent ${this.id} stopping...`);
  }

  protected async onSendMessage(message: Message): Promise<void> {
    // Handle inter-agent communication
    // This would typically integrate with Inngest or other messaging systems
    console.log(`CoderAgent ${this.id} sending message:`, message);
  }

  protected async onCancelTask(taskId: string): Promise<void> {
    // Cancel any ongoing OpenAI requests for this task
    console.log(`CoderAgent ${this.id} cancelling task: ${taskId}`);
  }

  async execute(task: AgentTask): Promise<CodeGenerationResult> {
    const codeTask = task as CodeGenerationTask;
    
    // Validate task
    if (!await this.validate(codeTask)) {
      throw new Error(`Invalid task: ${codeTask.id}`);
    }

    const startTime = Date.now();
    let tokensUsed = 0;

    try {
      // Update task status
      codeTask.status = TaskStatus.IN_PROGRESS;
      
      // Emit progress event
      this.emit('task.progress', {
        type: 'progress',
        agentId: this.id,
        taskId: codeTask.id,
        timestamp: new Date(),
        data: { status: 'starting_generation', progress: 0 }
      });

      // Generate code based on task type
      let result: CodeGenerationResult;
      
      switch (codeTask.type) {
        case 'code-generation':
          result = await this.generateCode(codeTask);
          break;
        case 'code-review':
          result = await this.reviewCode(codeTask);
          break;
        case 'code-refactor':
          result = await this.refactorCode(codeTask);
          break;
        case 'code-debug':
          result = await this.debugCode(codeTask);
          break;
        case 'code-test':
          result = await this.generateTests(codeTask);
          break;
        default:
          throw new Error(`Unsupported task type: ${codeTask.type}`);
      }

      // Update metadata
      result.metadata.generationTime = Date.now() - startTime;
      result.metadata.tokensUsed = tokensUsed;

      // Emit completion event
      this.emit('task.progress', {
        type: 'progress',
        agentId: this.id,
        taskId: codeTask.id,
        timestamp: new Date(),
        data: { status: 'completed', progress: 100, result }
      });

      return result;

    } catch (error) {
      // Emit error event
      this.emit('task.progress', {
        type: 'progress',
        agentId: this.id,
        taskId: codeTask.id,
        timestamp: new Date(),
        data: { status: 'error', error: error.message }
      });

      throw error;
    }
  }

  async validate(task: AgentTask): Promise<boolean> {
    const codeTask = task as CodeGenerationTask;
    
    // Check if task type is supported
    const supportedTypes = ['code-generation', 'code-review', 'code-refactor', 'code-debug', 'code-test'];
    if (!supportedTypes.includes(codeTask.type)) {
      return false;
    }

    // Check if prompt is provided
    if (!codeTask.payload?.prompt) {
      return false;
    }

    // Check language support
    if (codeTask.payload.language) {
      const supportedLanguages = this.coderConfig.codeGeneration?.supportedLanguages || [];
      if (supportedLanguages.length > 0 && !supportedLanguages.includes(codeTask.payload.language)) {
        return false;
      }
    }

    // Check file size limits
    if (codeTask.payload.existingCode) {
      const maxFileSize = this.coderConfig.codeGeneration?.maxFileSize || 50000;
      if (codeTask.payload.existingCode.length > maxFileSize) {
        return false;
      }
    }

    return true;
  }

  private async generateCode(task: CodeGenerationTask): Promise<CodeGenerationResult> {
    const { prompt, language, framework, requirements, context } = task.payload;
    
    // Build system prompt
    const systemPrompt = this.buildSystemPrompt('generation', language, framework, context);
    
    // Build user prompt
    const userPrompt = this.buildUserPrompt(prompt, requirements, context);
    
    // Emit progress
    this.emit('task.progress', {
      type: 'progress',
      agentId: this.id,
      taskId: task.id,
      timestamp: new Date(),
      data: { status: 'generating_code', progress: 25 }
    });

    if (this.coderConfig.openai.streaming) {
      return await this.generateCodeStreaming(task, systemPrompt, userPrompt);
    } else {
      return await this.generateCodeNonStreaming(task, systemPrompt, userPrompt);
    }
  }

  private async generateCodeStreaming(
    task: CodeGenerationTask,
    systemPrompt: string,
    userPrompt: string
  ): Promise<CodeGenerationResult> {
    const stream = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.coderConfig.openai.temperature || 0.2,
      max_tokens: this.coderConfig.openai.maxTokens || 4000,
      stream: true
    });

    let fullResponse = '';
    let progress = 30;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      fullResponse += content;
      
      // Emit streaming progress
      progress = Math.min(progress + 1, 90);
      this.emit('task.progress', {
        type: 'progress',
        agentId: this.id,
        taskId: task.id,
        timestamp: new Date(),
        data: { 
          status: 'streaming_response', 
          progress,
          partialContent: content,
          fullContent: fullResponse
        }
      });
    }

    return this.parseCodeResponse(fullResponse, task);
  }

  private async generateCodeNonStreaming(
    task: CodeGenerationTask,
    systemPrompt: string,
    userPrompt: string
  ): Promise<CodeGenerationResult> {
    const completion = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: this.coderConfig.openai.temperature || 0.2,
      max_tokens: this.coderConfig.openai.maxTokens || 4000
    });

    const response = completion.choices[0]?.message?.content || '';
    
    // Emit progress
    this.emit('task.progress', {
      type: 'progress',
      agentId: this.id,
      taskId: task.id,
      timestamp: new Date(),
      data: { status: 'parsing_response', progress: 75 }
    });

    return this.parseCodeResponse(response, task);
  }

  private async reviewCode(task: CodeGenerationTask): Promise<CodeGenerationResult> {
    const { prompt, existingCode, language, requirements } = task.payload;
    
    const systemPrompt = `You are an expert code reviewer. Analyze the provided code and provide detailed feedback on:
- Code quality and best practices
- Potential bugs or issues
- Performance improvements
- Security considerations
- Maintainability and readability
- Adherence to coding standards

Language: ${language || 'auto-detect'}
Format your response as JSON with the following structure:
{
  "code": "improved_code_if_applicable",
  "explanation": "detailed_analysis_and_feedback",
  "suggestions": ["suggestion1", "suggestion2"],
  "issues": ["issue1", "issue2"],
  "score": 85
}`;

    const userPrompt = `Review this code:
${existingCode}

Additional context: ${prompt}
${requirements ? `Requirements: ${requirements.join(', ')}` : ''}`;

    const completion = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: this.coderConfig.openai.maxTokens || 4000
    });

    const response = completion.choices[0]?.message?.content || '';
    
    try {
      const parsed = JSON.parse(response);
      return {
        code: parsed.code || existingCode,
        explanation: parsed.explanation || 'Code review completed',
        suggestions: parsed.suggestions || [],
        metadata: {
          language: language || 'unknown',
          tokensUsed: completion.usage?.total_tokens || 0,
          generationTime: 0,
          confidence: (parsed.score || 50) / 100
        }
      };
    } catch (error) {
      return {
        code: existingCode,
        explanation: response,
        suggestions: [],
        metadata: {
          language: language || 'unknown',
          tokensUsed: completion.usage?.total_tokens || 0,
          generationTime: 0,
          confidence: 0.5
        }
      };
    }
  }

  private async refactorCode(task: CodeGenerationTask): Promise<CodeGenerationResult> {
    const { prompt, existingCode, language, requirements } = task.payload;
    
    const systemPrompt = `You are an expert code refactoring specialist. Improve the provided code by:
- Enhancing readability and maintainability
- Following best practices and design patterns
- Optimizing performance where appropriate
- Ensuring proper error handling
- Adding appropriate comments and documentation

Language: ${language || 'auto-detect'}
Preserve the original functionality while making improvements.`;

    const userPrompt = `Refactor this code:
${existingCode}

Refactoring goals: ${prompt}
${requirements ? `Requirements: ${requirements.join(', ')}` : ''}`;

    const completion = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: this.coderConfig.openai.maxTokens || 4000
    });

    const response = completion.choices[0]?.message?.content || '';
    return this.parseCodeResponse(response, task);
  }

  private async debugCode(task: CodeGenerationTask): Promise<CodeGenerationResult> {
    const { prompt, existingCode, language } = task.payload;
    
    const systemPrompt = `You are an expert debugger. Analyze the provided code and:
- Identify potential bugs and issues
- Provide fixed versions of the code
- Explain what was wrong and why
- Suggest preventive measures

Language: ${language || 'auto-detect'}`;

    const userPrompt = `Debug this code:
${existingCode}

Issue description: ${prompt}`;

    const completion = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: this.coderConfig.openai.maxTokens || 4000
    });

    const response = completion.choices[0]?.message?.content || '';
    return this.parseCodeResponse(response, task);
  }

  private async generateTests(task: CodeGenerationTask): Promise<CodeGenerationResult> {
    const { prompt, existingCode, language, framework, testRequirements } = task.payload;
    
    const systemPrompt = `You are an expert test writer. Generate comprehensive tests for the provided code:
- Unit tests for individual functions
- Integration tests where appropriate
- Edge cases and error conditions
- Mock external dependencies
- Follow testing best practices

Language: ${language || 'auto-detect'}
Framework: ${framework || 'standard testing framework'}`;

    const userPrompt = `Generate tests for this code:
${existingCode}

Test requirements: ${prompt}
${testRequirements ? `Specific requirements: ${testRequirements.join(', ')}` : ''}`;

    const completion = await this.openai.chat.completions.create({
      model: this.coderConfig.openai.model || 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: this.coderConfig.openai.maxTokens || 4000
    });

    const response = completion.choices[0]?.message?.content || '';
    return this.parseCodeResponse(response, task);
  }

  private buildSystemPrompt(
    type: string,
    language?: string,
    framework?: string,
    context?: any
  ): string {
    let prompt = `You are an expert software developer and code generator. `;
    
    if (language) {
      prompt += `You specialize in ${language} development. `;
    }
    
    if (framework) {
      prompt += `You are working with the ${framework} framework. `;
    }
    
    if (context?.projectType) {
      prompt += `This is a ${context.projectType} project. `;
    }
    
    prompt += `
Generate high-quality, production-ready code that follows best practices including:
- Clean, readable code with proper naming conventions
- Appropriate error handling and validation
- Comprehensive comments and documentation
- Performance optimization where applicable
- Security best practices
- Proper testing considerations

${this.coderConfig.codeGeneration?.includeTests ? 'Include unit tests when appropriate.' : ''}
${this.coderConfig.codeGeneration?.includeDocumentation ? 'Include comprehensive documentation.' : ''}`;

    return prompt;
  }

  private buildUserPrompt(
    prompt: string,
    requirements?: string[],
    context?: any
  ): string {
    let userPrompt = `${prompt}\n`;
    
    if (requirements && requirements.length > 0) {
      userPrompt += `\nRequirements:\n${requirements.map(req => `- ${req}`).join('\n')}\n`;
    }
    
    if (context?.dependencies && context.dependencies.length > 0) {
      userPrompt += `\nAvailable dependencies:\n${context.dependencies.map(dep => `- ${dep}`).join('\n')}\n`;
    }
    
    if (context?.codeStyle) {
      userPrompt += `\nCode style requirements: ${context.codeStyle}\n`;
    }
    
    return userPrompt;
  }

  private parseCodeResponse(response: string, task: CodeGenerationTask): CodeGenerationResult {
    // Extract code blocks from response
    const codeBlocks = this.extractCodeBlocks(response);
    const mainCode = codeBlocks[0] || response;
    
    // Extract explanation
    const explanation = this.extractExplanation(response);
    
    // Extract suggestions
    const suggestions = this.extractSuggestions(response);
    
    // Calculate confidence based on response quality
    const confidence = this.calculateConfidence(response, task);
    
    return {
      code: mainCode,
      explanation,
      suggestions,
      tests: this.coderConfig.codeGeneration?.includeTests ? this.extractTests(response) : undefined,
      documentation: this.coderConfig.codeGeneration?.includeDocumentation ? this.extractDocumentation(response) : undefined,
      metadata: {
        language: task.payload.language || 'unknown',
        framework: task.payload.framework,
        tokensUsed: 0, // Will be updated in execute method
        generationTime: 0, // Will be updated in execute method
        confidence
      }
    };
  }

  private extractCodeBlocks(response: string): string[] {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
    const matches = [];
    let match;
    
    while ((match = codeBlockRegex.exec(response)) !== null) {
      matches.push(match[1]);
    }
    
    return matches;
  }

  private extractExplanation(response: string): string {
    // Remove code blocks and extract explanation text
    const withoutCodeBlocks = response.replace(/```[\w]*\n[\s\S]*?\n```/g, '');
    return withoutCodeBlocks.trim();
  }

  private extractSuggestions(response: string): string[] {
    const suggestions = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        suggestions.push(line.trim().substring(2));
      }
    }
    
    return suggestions;
  }

  private extractTests(response: string): string | undefined {
    // Look for test-related code blocks
    const testKeywords = ['test', 'spec', 'jest', 'mocha', 'vitest'];
    const codeBlocks = this.extractCodeBlocks(response);
    
    for (const block of codeBlocks) {
      if (testKeywords.some(keyword => block.toLowerCase().includes(keyword))) {
        return block;
      }
    }
    
    return undefined;
  }

  private extractDocumentation(response: string): string | undefined {
    // Look for documentation sections
    const docKeywords = ['documentation', 'readme', 'api', 'usage'];
    const lines = response.split('\n');
    let docSection = '';
    let inDocSection = false;
    
    for (const line of lines) {
      if (docKeywords.some(keyword => line.toLowerCase().includes(keyword))) {
        inDocSection = true;
      }
      
      if (inDocSection) {
        docSection += line + '\n';
      }
    }
    
    return docSection.trim() || undefined;
  }

  private calculateConfidence(response: string, task: CodeGenerationTask): number {
    let confidence = 0.5; // Base confidence
    
    // Check for code blocks
    if (this.extractCodeBlocks(response).length > 0) {
      confidence += 0.2;
    }
    
    // Check for explanation
    if (this.extractExplanation(response).length > 50) {
      confidence += 0.1;
    }
    
    // Check for specific language syntax
    if (task.payload.language) {
      const languageKeywords = {
        'javascript': ['function', 'const', 'let', 'var', '=>'],
        'python': ['def', 'class', 'import', 'from'],
        'java': ['public', 'private', 'class', 'interface'],
        'typescript': ['interface', 'type', 'extends', 'implements']
      };
      
      const keywords = languageKeywords[task.payload.language.toLowerCase()] || [];
      const keywordCount = keywords.filter(keyword => response.includes(keyword)).length;
      confidence += Math.min(keywordCount * 0.05, 0.2);
    }
    
    return Math.min(confidence, 1.0);
  }

  // Override canHandle to be more specific for code tasks
  canHandle(task: AgentTask): boolean {
    const codeTypes = ['code-generation', 'code-review', 'code-refactor', 'code-debug', 'code-test'];
    return codeTypes.includes(task.type) && super.canHandle(task);
  }
}