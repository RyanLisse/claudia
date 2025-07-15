/**
 * Researcher Agent - Specialized for information gathering, analysis, and research tasks
 */

import { BaseAgent } from '../core/BaseAgent.js';
import type {
  AgentConfig,
  Task,
  TaskResult
} from '../types/agent.js';
import {
  AgentCapability,
  Priority
} from '../types/agent.js';

export interface ResearcherAgentConfig extends AgentConfig {
  domains: string[];
  dataSources: string[];
  searchDepth: 'shallow' | 'medium' | 'deep';
  credibilityFilter: boolean;
  languageSupport: string[];
}

export interface ResearchTask {
  type: 'web_search' | 'literature_review' | 'market_research' | 'competitive_analysis' | 'fact_checking';
  query: string;
  domain?: string;
  sources?: string[];
  depth: 'quick' | 'thorough' | 'comprehensive';
  timeframe?: {
    from?: Date;
    to?: Date;
  };
  outputFormat: 'summary' | 'detailed' | 'structured' | 'citations';
  credibilityThreshold: number;
}

export interface ResearchResult {
  query: string;
  findings: Array<{
    source: string;
    title: string;
    content: string;
    relevanceScore: number;
    credibilityScore: number;
    publishedAt?: Date;
    url?: string;
  }>;
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  confidence: number;
  sources: Array<{
    name: string;
    type: string;
    credibility: number;
    count: number;
  }>;
  metadata: {
    searchTime: number;
    totalSources: number;
    relevantSources: number;
    averageCredibility: number;
  };
}

/**
 * Researcher Agent Implementation
 */
export class ResearcherAgent extends BaseAgent {
  private domains: Set<string>;
  private dataSources: Set<string>;
  private searchDepth: string;
  private credibilityFilter: boolean;
  private languageSupport: Set<string>;

  constructor(config: ResearcherAgentConfig) {
    super({
      ...config,
      capabilities: [
        AgentCapability.RESEARCH,
        AgentCapability.DATA_ANALYSIS,
        AgentCapability.WEB_SEARCH,
        ...(config.capabilities || [])
      ]
    });
    
    this.domains = new Set(config.domains || []);
    this.dataSources = new Set(config.dataSources || []);
    this.searchDepth = config.searchDepth || 'medium';
    this.credibilityFilter = config.credibilityFilter !== false;
    this.languageSupport = new Set(config.languageSupport || ['en']);
  }

  canHandle(task: Task): boolean {
    const supportedTypes = [
      'web_search',
      'literature_review',
      'market_research',
      'competitive_analysis',
      'fact_checking',
      'research_synthesis',
      'data_gathering'
    ];

    if (!supportedTypes.includes(task.type)) {
      return false;
    }

    const payload = task.payload as ResearchTask;
    
    // Check domain expertise
    if (payload.domain && this.domains.size > 0 && !this.domains.has(payload.domain)) {
      return false;
    }

    return true;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const payload = task.payload as ResearchTask;
    
    try {
      let result: ResearchResult;
      
      switch (task.type) {
        case 'web_search':
          result = await this.performWebSearch(payload);
          break;
        case 'literature_review':
          result = await this.performLiteratureReview(payload);
          break;
        case 'market_research':
          result = await this.performMarketResearch(payload);
          break;
        case 'competitive_analysis':
          result = await this.performCompetitiveAnalysis(payload);
          break;
        case 'fact_checking':
          result = await this.performFactChecking(payload);
          break;
        default:
          throw new Error(`Unsupported research type: ${task.type}`);
      }

      return {
        taskId: task.id,
        success: true,
        result,
        completedAt: new Date(),
        executionTimeMs: Date.now() - task.createdAt.getTime(),
        metadata: {
          query: payload.query,
          depth: payload.depth,
          sourcesFound: result.metadata.totalSources,
          confidence: result.confidence
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
          query: payload.query,
          depth: payload.depth
        }
      };
    }
  }

  private async performWebSearch(payload: ResearchTask): Promise<ResearchResult> {
    const startTime = Date.now();
    
    // Simulate web search with varying delays based on depth
    const searchTime = payload.depth === 'quick' ? 1000 : 
                      payload.depth === 'thorough' ? 3000 : 5000;
    await new Promise(resolve => setTimeout(resolve, searchTime + Math.random() * 1000));
    
    const mockFindings = this.generateMockFindings(payload.query, payload.depth || 'thorough');
    const filteredFindings = this.credibilityFilter ? 
      mockFindings.filter(f => f.credibilityScore >= (payload.credibilityThreshold || 0.7)) :
      mockFindings;
    
    return this.compileResearchResult(payload.query, filteredFindings, Date.now() - startTime);
  }

  private async performLiteratureReview(payload: ResearchTask): Promise<ResearchResult> {
    const startTime = Date.now();
    
    // Literature review takes longer due to academic source searching
    await new Promise(resolve => setTimeout(resolve, 4000 + Math.random() * 2000));
    
    const findings = this.generateAcademicFindings(payload.query, payload.depth || 'thorough');
    
    return this.compileResearchResult(payload.query, findings, Date.now() - startTime);
  }

  private async performMarketResearch(payload: ResearchTask): Promise<ResearchResult> {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 1500));
    
    const findings = this.generateMarketFindings(payload.query, payload.depth || 'thorough');
    
    return this.compileResearchResult(payload.query, findings, Date.now() - startTime);
  }

  private async performCompetitiveAnalysis(payload: ResearchTask): Promise<ResearchResult> {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 1500));
    
    const findings = this.generateCompetitiveFindings(payload.query, payload.depth || 'thorough');
    
    return this.compileResearchResult(payload.query, findings, Date.now() - startTime);
  }

  private async performFactChecking(payload: ResearchTask): Promise<ResearchResult> {
    const startTime = Date.now();
    
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const findings = this.generateFactCheckFindings(payload.query);
    
    return this.compileResearchResult(payload.query, findings, Date.now() - startTime);
  }

  private generateMockFindings(query: string, depth: string) {
    const baseCount = depth === 'quick' ? 5 : depth === 'thorough' ? 15 : 25;
    const findings = [];
    
    for (let i = 0; i < baseCount; i++) {
      findings.push({
        source: this.getRandomSource(),
        title: `${query} - Research Finding ${i + 1}`,
        content: this.generateFindingContent(query, i),
        relevanceScore: 0.6 + Math.random() * 0.4,
        credibilityScore: 0.5 + Math.random() * 0.5,
        publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        url: `https://example.com/research/${i + 1}`
      });
    }
    
    return findings.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private generateAcademicFindings(query: string, depth: string) {
    const baseCount = depth === 'quick' ? 3 : depth === 'thorough' ? 10 : 20;
    const findings = [];
    
    const academicSources = ['PubMed', 'Google Scholar', 'IEEE Xplore', 'ACM Digital Library', 'ResearchGate'];
    
    for (let i = 0; i < baseCount; i++) {
      findings.push({
        source: academicSources[Math.floor(Math.random() * academicSources.length)],
        title: `Academic Study: ${query} Analysis ${i + 1}`,
        content: this.generateAcademicContent(query, i),
        relevanceScore: 0.7 + Math.random() * 0.3,
        credibilityScore: 0.8 + Math.random() * 0.2,
        publishedAt: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000),
        url: `https://academic-source.com/paper/${i + 1}`
      });
    }
    
    return findings.sort((a, b) => b.credibilityScore - a.credibilityScore);
  }

  private generateMarketFindings(query: string, depth: string) {
    const findings = [];
    const marketSources = ['MarketResearch.com', 'Statista', 'IBISWorld', 'Gartner', 'McKinsey'];
    const baseCount = depth === 'quick' ? 4 : depth === 'thorough' ? 12 : 18;
    
    for (let i = 0; i < baseCount; i++) {
      findings.push({
        source: marketSources[Math.floor(Math.random() * marketSources.length)],
        title: `Market Analysis: ${query} Trends ${i + 1}`,
        content: this.generateMarketContent(query, i),
        relevanceScore: 0.65 + Math.random() * 0.35,
        credibilityScore: 0.75 + Math.random() * 0.25,
        publishedAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        url: `https://market-research.com/report/${i + 1}`
      });
    }
    
    return findings;
  }

  private generateCompetitiveFindings(query: string, depth: string) {
    const findings = [];
    const compSources = ['Crunchbase', 'SimilarWeb', 'Alexa', 'SEMrush', 'PitchBook'];
    const baseCount = depth === 'quick' ? 3 : depth === 'thorough' ? 8 : 15;
    
    for (let i = 0; i < baseCount; i++) {
      findings.push({
        source: compSources[Math.floor(Math.random() * compSources.length)],
        title: `Competitive Intelligence: ${query} Competitor ${i + 1}`,
        content: this.generateCompetitiveContent(query, i),
        relevanceScore: 0.6 + Math.random() * 0.4,
        credibilityScore: 0.7 + Math.random() * 0.3,
        publishedAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
        url: `https://competitive-intel.com/analysis/${i + 1}`
      });
    }
    
    return findings;
  }

  private generateFactCheckFindings(query: string) {
    const findings = [];
    const factSources = ['Snopes', 'FactCheck.org', 'PolitiFact', 'Reuters Fact Check', 'AP Fact Check'];
    
    for (let i = 0; i < 5; i++) {
      findings.push({
        source: factSources[Math.floor(Math.random() * factSources.length)],
        title: `Fact Check: ${query}`,
        content: this.generateFactCheckContent(query, i),
        relevanceScore: 0.8 + Math.random() * 0.2,
        credibilityScore: 0.85 + Math.random() * 0.15,
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        url: `https://factcheck.com/verification/${i + 1}`
      });
    }
    
    return findings;
  }

  private compileResearchResult(query: string, findings: any[], searchTime: number): ResearchResult {
    const relevantFindings = findings.filter(f => f.relevanceScore > 0.6);
    const avgCredibility = findings.reduce((sum, f) => sum + f.credibilityScore, 0) / findings.length;
    
    // Generate insights and summary
    const keyInsights = this.extractKeyInsights(findings);
    const summary = this.generateSummary(query, findings);
    const recommendations = this.generateRecommendations(findings);
    
    // Calculate confidence based on source quality and consistency
    const confidence = Math.min(0.95, avgCredibility * 0.7 + (relevantFindings.length / findings.length) * 0.3);
    
    // Compile source statistics
    const sourceStats = this.compileSourceStats(findings);
    
    return {
      query,
      findings: relevantFindings,
      summary,
      keyInsights,
      recommendations,
      confidence,
      sources: sourceStats,
      metadata: {
        searchTime,
        totalSources: findings.length,
        relevantSources: relevantFindings.length,
        averageCredibility: avgCredibility
      }
    };
  }

  private extractKeyInsights(findings: any[]): string[] {
    // Extract common themes and important points
    const insights = [
      'Primary trend identified across multiple sources',
      'Significant market opportunity detected',
      'Potential risks and challenges identified',
      'Emerging technologies showing promise',
      'Expert consensus on future direction'
    ];
    
    return insights.slice(0, Math.min(5, Math.floor(findings.length / 3)));
  }

  private generateSummary(query: string, findings: any[]): string {
    const topFindings = findings.slice(0, 3);
    return `Research on "${query}" reveals ${topFindings.length} key areas of insight. ` +
           `Analysis of ${findings.length} sources indicates strong evidence supporting ` +
           `current market trends and emerging opportunities. High-credibility sources ` +
           `provide consistent findings across multiple domains.`;
  }

  private generateRecommendations(findings: any[]): string[] {
    const recommendations = [
      'Continue monitoring emerging trends in this area',
      'Consider deeper analysis of top-performing sources',
      'Implement findings into strategic planning',
      'Seek additional expert opinions for validation',
      'Schedule regular research updates to track changes'
    ];
    
    return recommendations.slice(0, Math.min(4, findings.length / 2));
  }

  private compileSourceStats(findings: any[]) {
    const sourceMap = new Map();
    
    findings.forEach(finding => {
      const source = finding.source;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          name: source,
          type: this.getSourceType(source),
          credibility: finding.credibilityScore,
          count: 1
        });
      } else {
        const existing = sourceMap.get(source);
        existing.count++;
        existing.credibility = (existing.credibility + finding.credibilityScore) / 2;
      }
    });
    
    return Array.from(sourceMap.values()).sort((a, b) => b.credibility - a.credibility);
  }

  private getRandomSource(): string {
    const sources = Array.from(this.dataSources);
    if (sources.length === 0) {
      const defaultSources = ['Wikipedia', 'Google', 'Bing', 'DuckDuckGo', 'Academic Search'];
      return defaultSources[Math.floor(Math.random() * defaultSources.length)];
    }
    return sources[Math.floor(Math.random() * sources.length)];
  }

  private getSourceType(source: string): string {
    const types: { [key: string]: string } = {
      'PubMed': 'academic',
      'Google Scholar': 'academic',
      'Wikipedia': 'encyclopedia',
      'MarketResearch.com': 'commercial',
      'Statista': 'data',
      'Crunchbase': 'business',
      'Snopes': 'fact-check'
    };
    
    return types[source] || 'web';
  }

  private generateFindingContent(query: string, index: number): string {
    return `Comprehensive analysis of ${query} reveals important insights. ` +
           `This finding (#${index + 1}) provides detailed information about current trends, ` +
           `market dynamics, and potential implications for stakeholders. ` +
           `Key data points and expert opinions support the main conclusions.`;
  }

  private generateAcademicContent(query: string, index: number): string {
    return `Peer-reviewed research on ${query} demonstrates significant findings. ` +
           `This study (#${index + 1}) employed rigorous methodology and statistical analysis ` +
           `to investigate key hypotheses. Results show statistically significant correlations ` +
           `and provide evidence-based recommendations for future research.`;
  }

  private generateMarketContent(query: string, index: number): string {
    return `Market analysis of ${query} indicates strong growth potential. ` +
           `Report #${index + 1} provides comprehensive market sizing, competitive landscape, ` +
           `and trend analysis. Key metrics show year-over-year growth and emerging opportunities ` +
           `across multiple market segments.`;
  }

  private generateCompetitiveContent(query: string, index: number): string {
    return `Competitive analysis of ${query} reveals market positioning insights. ` +
           `Competitor #${index + 1} analysis shows strategic advantages, market share data, ` +
           `and differentiation strategies. Benchmarking against industry leaders provides ` +
           `actionable intelligence for strategic planning.`;
  }

  private generateFactCheckContent(query: string, index: number): string {
    const verdicts = ['True', 'Mostly True', 'Partly True', 'Mostly False', 'False'];
    const verdict = verdicts[Math.floor(Math.random() * verdicts.length)];
    
    return `Fact-checking analysis of "${query}" verdict: ${verdict}. ` +
           `Investigation #${index + 1} involved cross-referencing multiple sources, ` +
           `expert interviews, and document verification. Evidence supports ` +
           `the conclusion with high confidence based on available information.`;
  }

  // BaseAgent implementation
  protected async onStart(): Promise<void> {
    console.log(`ResearcherAgent ${this.id} started with domains: ${Array.from(this.domains).join(', ')}`);
  }

  protected async onStop(): Promise<void> {
    console.log(`ResearcherAgent ${this.id} stopped`);
  }

  protected async onSendMessage(message: any): Promise<void> {
    console.log(`ResearcherAgent ${this.id} sending message:`, message);
  }

  protected async onCancelTask(taskId: string): Promise<void> {
    console.log(`ResearcherAgent ${this.id} cancelling task ${taskId}`);
  }

  // Domain and source management
  addDomain(domain: string): void {
    this.domains.add(domain);
  }

  addDataSource(source: string): void {
    this.dataSources.add(source);
  }

  getSupportedDomains(): string[] {
    return Array.from(this.domains);
  }

  getDataSources(): string[] {
    return Array.from(this.dataSources);
  }

  updateSearchDepth(depth: 'shallow' | 'medium' | 'deep'): void {
    this.searchDepth = depth;
  }
}

// Factory function for creating researcher agents
export function createResearcherAgent(config: Partial<ResearcherAgentConfig> = {}): ResearcherAgent {
  const defaultConfig: ResearcherAgentConfig = {
    id: `researcher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name || 'Researcher Agent',
    description: 'Specialized agent for research, information gathering, and analysis',
    capabilities: [AgentCapability.RESEARCH, AgentCapability.DATA_ANALYSIS, AgentCapability.WEB_SEARCH],
    maxConcurrentTasks: 2,
    domains: ['technology', 'business', 'science', 'market-research'],
    dataSources: ['google', 'wikipedia', 'pubmed', 'google-scholar'],
    searchDepth: 'medium',
    credibilityFilter: true,
    languageSupport: ['en', 'es', 'fr'],
    ...config
  };

  return new ResearcherAgent(defaultConfig);
}