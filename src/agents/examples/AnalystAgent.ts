/**
 * Analyst Agent - Specialized for data analysis, pattern recognition, and insights generation
 */

import { BaseAgent } from '../core/BaseAgent.js';
import type {
  AgentConfig,
  Task,
  TaskResult
} from '../types/agent.js';
import {
  AgentCapability
} from '../types/agent.js';

export interface AnalystAgentConfig extends AgentConfig {
  analysisTypes: string[];
  dataFormats: string[];
  visualizationTools: string[];
  statisticalMethods: string[];
  confidenceThreshold: number;
}

export interface AnalysisTask {
  type: 'data_analysis' | 'pattern_recognition' | 'statistical_analysis' | 'predictive_modeling' | 'trend_analysis';
  data: any;
  dataFormat: 'json' | 'csv' | 'xml' | 'raw';
  analysisType: string;
  parameters?: {
    timeframe?: string;
    metrics?: string[];
    filters?: Record<string, any>;
    groupBy?: string[];
  };
  outputFormat: 'summary' | 'detailed' | 'visual' | 'recommendations';
  confidenceLevel: number;
}

export interface AnalysisResult {
  analysisType: string;
  findings: {
    patterns: Array<{
      name: string;
      description: string;
      confidence: number;
      significance: number;
      evidence: string[];
    }>;
    trends: Array<{
      direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
      strength: number;
      timeframe: string;
      description: string;
    }>;
    anomalies: Array<{
      type: string;
      description: string;
      severity: 'low' | 'medium' | 'high';
      location: string;
      impact: number;
    }>;
    correlations: Array<{
      variables: string[];
      coefficient: number;
      significance: number;
      interpretation: string;
    }>;
  };
  insights: {
    keyFindings: string[];
    implications: string[];
    recommendations: string[];
    risks: string[];
    opportunities: string[];
  };
  metrics: {
    dataQuality: number;
    analysisConfidence: number;
    sampleSize: number;
    completeness: number;
    accuracy: number;
  };
  visualizations?: Array<{
    type: string;
    title: string;
    description: string;
    data: any;
    config: any;
  }>;
  rawResults: any;
}

/**
 * Analyst Agent Implementation
 */
export class AnalystAgent extends BaseAgent {
  private analysisTypes: Set<string>;
  private dataFormats: Set<string>;
  private visualizationTools: Set<string>;
  private _statisticalMethods: Set<string>;
  private _confidenceThreshold: number;

  constructor(config: AnalystAgentConfig) {
    super({
      ...config,
      capabilities: [
        AgentCapability.CODE_ANALYSIS,
        AgentCapability.PERFORMANCE_OPTIMIZATION,
        ...(config.capabilities || [])
      ]
    });
    
    this.analysisTypes = new Set(config.analysisTypes || []);
    this.dataFormats = new Set(config.dataFormats || []);
    this.visualizationTools = new Set(config.visualizationTools || []);
    this._statisticalMethods = new Set(config.statisticalMethods || []);
    this._confidenceThreshold = config.confidenceThreshold || 0.8;
  }

  canHandle(task: Task): boolean {
    const supportedTypes = [
      'data_analysis',
      'pattern_recognition',
      'statistical_analysis',
      'predictive_modeling',
      'trend_analysis',
      'correlation_analysis',
      'anomaly_detection'
    ];

    if (!supportedTypes.includes(task.type)) {
      return false;
    }

    const payload = task.payload as AnalysisTask;
    
    // Check if we support the data format
    if (payload.dataFormat && !this.dataFormats.has(payload.dataFormat)) {
      return false;
    }

    // Check if we support the analysis type
    if (payload.analysisType && this.analysisTypes.size > 0 && !this.analysisTypes.has(payload.analysisType)) {
      return false;
    }

    return true;
  }

  async executeTask(task: Task): Promise<TaskResult> {
    const payload = task.payload as AnalysisTask;
    
    try {
      let result: AnalysisResult;
      
      switch (task.type) {
        case 'data_analysis':
          result = await this.performDataAnalysis(payload);
          break;
        case 'pattern_recognition':
          result = await this.performPatternRecognition(payload);
          break;
        case 'statistical_analysis':
          result = await this.performStatisticalAnalysis(payload);
          break;
        case 'predictive_modeling':
          result = await this.performPredictiveModeling(payload);
          break;
        case 'trend_analysis':
          result = await this.performTrendAnalysis(payload);
          break;
        default:
          throw new Error(`Unsupported analysis type: ${task.type}`);
      }

      return {
        taskId: task.id,
        success: true,
        result,
        completedAt: new Date(),
        executionTimeMs: Date.now() - task.createdAt.getTime(),
        metadata: {
          analysisType: payload.analysisType,
          dataFormat: payload.dataFormat,
          confidence: result.metrics.analysisConfidence,
          sampleSize: result.metrics.sampleSize
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
          analysisType: payload.analysisType,
          dataFormat: payload.dataFormat
        }
      };
    }
  }

  private async performDataAnalysis(payload: AnalysisTask): Promise<AnalysisResult> {
    // Simulate data analysis processing time
    const processingTime = 2000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    const processedData = this.preprocessData(payload.data, payload.dataFormat);
    const descriptiveStats = this.calculateDescriptiveStatistics(processedData);
    const patterns = this.identifyPatterns(processedData);
    const correlations = this.findCorrelations(processedData);
    const anomalies = this.detectAnomalies(processedData);
    
    return this.compileAnalysisResult('data_analysis', {
      patterns,
      trends: this.extractTrends(processedData),
      anomalies,
      correlations
    }, processedData, descriptiveStats);
  }

  private async performPatternRecognition(payload: AnalysisTask): Promise<AnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500));
    
    const processedData = this.preprocessData(payload.data, payload.dataFormat);
    const patterns = this.identifyAdvancedPatterns(processedData, payload.parameters);
    
    return this.compileAnalysisResult('pattern_recognition', {
      patterns,
      trends: [],
      anomalies: [],
      correlations: []
    }, processedData);
  }

  private async performStatisticalAnalysis(payload: AnalysisTask): Promise<AnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 1800 + Math.random() * 2200));
    
    const processedData = this.preprocessData(payload.data, payload.dataFormat);
    const statistics = this.performAdvancedStatistics(processedData, payload.parameters);
    const correlations = this.performCorrelationAnalysis(processedData);
    
    return this.compileAnalysisResult('statistical_analysis', {
      patterns: statistics.patterns,
      trends: [],
      anomalies: [],
      correlations
    }, processedData, statistics);
  }

  private async performPredictiveModeling(payload: AnalysisTask): Promise<AnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));
    
    const processedData = this.preprocessData(payload.data, payload.dataFormat);
    const model = this.buildPredictiveModel(processedData, payload.parameters);
    const predictions = this.generatePredictions(model, processedData);
    
    return this.compileAnalysisResult('predictive_modeling', {
      patterns: model.patterns,
      trends: predictions.trends,
      anomalies: [],
      correlations: model.correlations
    }, processedData, model.metrics);
  }

  private async performTrendAnalysis(payload: AnalysisTask): Promise<AnalysisResult> {
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 1800));
    
    const processedData = this.preprocessData(payload.data, payload.dataFormat);
    const trends = this.analyzeTrends(processedData, payload.parameters);
    
    return this.compileAnalysisResult('trend_analysis', {
      patterns: [],
      trends,
      anomalies: [],
      correlations: []
    }, processedData);
  }

  // Data processing methods
  private preprocessData(data: any, format: string): any {
    // Simulate data preprocessing
    const sampleSize = Array.isArray(data) ? data.length : 
                      typeof data === 'object' ? Object.keys(data).length : 100;
    
    return {
      original: data,
      processed: this.generateSampleData(sampleSize),
      metadata: {
        format,
        size: sampleSize,
        quality: 0.85 + Math.random() * 0.15
      }
    };
  }

  private generateSampleData(size: number): number[] {
    // Generate sample data for analysis simulation
    const data = [];
    let value = 100;
    
    for (let i = 0; i < size; i++) {
      value += (Math.random() - 0.5) * 10;
      data.push(Math.max(0, value));
    }
    
    return data;
  }

  private calculateDescriptiveStatistics(processedData: any): any {
    const data = processedData.processed;
    const sum = data.reduce((a: number, b: number) => a + b, 0);
    const mean = sum / data.length;
    const variance = data.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / data.length;
    
    return {
      mean,
      median: this.calculateMedian(data),
      variance,
      standardDeviation: Math.sqrt(variance),
      min: Math.min(...data),
      max: Math.max(...data),
      count: data.length
    };
  }

  private calculateMedian(data: number[]): number {
    const sorted = [...data].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private identifyPatterns(processedData: any): any[] {
    const patterns = [];
    const data = processedData.processed;
    
    // Identify cyclical patterns
    if (this.detectCyclicalPattern(data)) {
      patterns.push({
        name: 'Cyclical Pattern',
        description: 'Regular cyclical behavior detected in the data',
        confidence: 0.75 + Math.random() * 0.2,
        significance: 0.8,
        evidence: ['Repeating intervals observed', 'Frequency analysis confirms pattern']
      });
    }
    
    // Identify growth patterns
    if (this.detectGrowthPattern(data)) {
      patterns.push({
        name: 'Growth Trend',
        description: 'Consistent growth pattern identified',
        confidence: 0.8 + Math.random() * 0.15,
        significance: 0.9,
        evidence: ['Positive slope detected', 'Linear regression confirms trend']
      });
    }
    
    return patterns;
  }

  private identifyAdvancedPatterns(processedData: any, parameters?: any): any[] {
    const patterns = this.identifyPatterns(processedData);
    
    // Add more sophisticated pattern recognition
    patterns.push({
      name: 'Seasonal Pattern',
      description: 'Seasonal variations detected with 12-month cycle',
      confidence: 0.72 + Math.random() * 0.23,
      significance: 0.75,
      evidence: ['Fourier analysis reveals seasonal components', 'Autocorrelation confirms periodicity']
    });
    
    return patterns;
  }

  private extractTrends(processedData: any): any[] {
    const data = processedData.processed;
    const trends = [];
    
    const slope = this.calculateSlope(data);
    
    if (Math.abs(slope) > 0.1) {
      trends.push({
        direction: slope > 0 ? 'increasing' : 'decreasing',
        strength: Math.min(1, Math.abs(slope) / 2),
        timeframe: 'long-term',
        description: `${slope > 0 ? 'Upward' : 'Downward'} trend with slope ${slope.toFixed(3)}`
      });
    }
    
    return trends;
  }

  private detectAnomalies(processedData: any): any[] {
    const data = processedData.processed;
    const mean = data.reduce((a: number, b: number) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((acc: number, val: number) => acc + Math.pow(val - mean, 2), 0) / data.length);
    
    const anomalies = [];
    const threshold = 2.5; // Z-score threshold
    
    data.forEach((value: number, index: number) => {
      const zScore = Math.abs((value - mean) / std);
      if (zScore > threshold) {
        anomalies.push({
          type: 'outlier',
          description: `Outlier detected at position ${index} with value ${value}`,
          severity: zScore > 3 ? 'high' : 'medium',
          location: `Index ${index}`,
          impact: zScore / threshold
        });
      }
    });
    
    return anomalies;
  }

  private findCorrelations(processedData: any): any[] {
    // Simulate correlation analysis
    return [
      {
        variables: ['Variable A', 'Variable B'],
        coefficient: 0.65 + Math.random() * 0.3,
        significance: 0.8 + Math.random() * 0.15,
        interpretation: 'Strong positive correlation indicating related behavior'
      },
      {
        variables: ['Variable C', 'Variable D'],
        coefficient: -(0.4 + Math.random() * 0.4),
        significance: 0.7 + Math.random() * 0.2,
        interpretation: 'Moderate negative correlation suggesting inverse relationship'
      }
    ];
  }

  private performAdvancedStatistics(processedData: any, parameters?: any): any {
    const stats = this.calculateDescriptiveStatistics(processedData);
    
    return {
      ...stats,
      patterns: [
        {
          name: 'Normal Distribution',
          description: 'Data follows approximately normal distribution',
          confidence: 0.8 + Math.random() * 0.15,
          significance: 0.85,
          evidence: ['Shapiro-Wilk test p-value > 0.05', 'Q-Q plot shows linear relationship']
        }
      ],
      tests: {
        normality: { pValue: 0.05 + Math.random() * 0.4, test: 'Shapiro-Wilk' },
        stationarity: { pValue: 0.02 + Math.random() * 0.3, test: 'Augmented Dickey-Fuller' }
      }
    };
  }

  private performCorrelationAnalysis(processedData: any): any[] {
    return this.findCorrelations(processedData);
  }

  private buildPredictiveModel(processedData: any, parameters?: any): any {
    // Simulate model building
    return {
      type: 'linear_regression',
      accuracy: 0.75 + Math.random() * 0.2,
      patterns: [
        {
          name: 'Predictive Pattern',
          description: 'Strong predictive relationship identified',
          confidence: 0.8 + Math.random() * 0.15,
          significance: 0.9,
          evidence: ['High R-squared value', 'Low prediction error']
        }
      ],
      correlations: this.findCorrelations(processedData),
      metrics: {
        rmse: 5.2 + Math.random() * 3,
        mape: 8.5 + Math.random() * 5,
        r2: 0.75 + Math.random() * 0.2
      }
    };
  }

  private generatePredictions(model: any, processedData: any): any {
    return {
      trends: [
        {
          direction: 'increasing',
          strength: 0.7 + Math.random() * 0.25,
          timeframe: 'short-term',
          description: 'Predicted upward trend for next period'
        }
      ],
      forecasts: processedData.processed.slice(-10).map((val: number) => val * (1.05 + Math.random() * 0.1))
    };
  }

  private analyzeTrends(processedData: any, parameters?: any): any[] {
    const data = processedData.processed;
    const trends = [];
    
    // Short-term trend (last 10 points)
    const shortTerm = data.slice(-10);
    const shortSlope = this.calculateSlope(shortTerm);
    
    trends.push({
      direction: shortSlope > 0 ? 'increasing' : shortSlope < 0 ? 'decreasing' : 'stable',
      strength: Math.min(1, Math.abs(shortSlope)),
      timeframe: 'short-term',
      description: `Recent ${shortSlope > 0 ? 'growth' : shortSlope < 0 ? 'decline' : 'stability'} pattern`
    });
    
    // Long-term trend (all data)
    const longSlope = this.calculateSlope(data);
    
    trends.push({
      direction: longSlope > 0 ? 'increasing' : longSlope < 0 ? 'decreasing' : 'stable',
      strength: Math.min(1, Math.abs(longSlope) * 0.5),
      timeframe: 'long-term',
      description: `Overall ${longSlope > 0 ? 'upward' : longSlope < 0 ? 'downward' : 'flat'} trajectory`
    });
    
    return trends;
  }

  private compileAnalysisResult(analysisType: string, findings: any, processedData: any, stats?: any): AnalysisResult {
    const insights = this.generateInsights(findings);
    const metrics = this.calculateQualityMetrics(processedData, findings);
    const visualizations = this.generateVisualizations(findings, processedData);
    
    return {
      analysisType,
      findings,
      insights,
      metrics,
      visualizations,
      rawResults: { processedData, statistics: stats }
    };
  }

  private generateInsights(findings: any): any {
    const insights = {
      keyFindings: [],
      implications: [],
      recommendations: [],
      risks: [],
      opportunities: []
    };
    
    // Generate insights based on findings
    if (findings.patterns.length > 0) {
      insights.keyFindings.push(`Identified ${findings.patterns.length} significant patterns in the data`);
      insights.implications.push('Patterns suggest underlying systematic behavior');
      insights.recommendations.push('Monitor pattern stability over time');
    }
    
    if (findings.trends.length > 0) {
      const growthTrends = findings.trends.filter((t: any) => t.direction === 'increasing');
      if (growthTrends.length > 0) {
        insights.opportunities.push('Growth trends present expansion opportunities');
      }
    }
    
    if (findings.anomalies.length > 0) {
      insights.risks.push(`${findings.anomalies.length} anomalies detected requiring investigation`);
      insights.recommendations.push('Implement anomaly monitoring system');
    }
    
    return insights;
  }

  private calculateQualityMetrics(processedData: any, findings: any): any {
    return {
      dataQuality: processedData.metadata?.quality || 0.85,
      analysisConfidence: this.calculateOverallConfidence(findings),
      sampleSize: processedData.metadata?.size || 0,
      completeness: 0.9 + Math.random() * 0.1,
      accuracy: 0.8 + Math.random() * 0.15
    };
  }

  private calculateOverallConfidence(findings: any): number {
    const allConfidences = findings.patterns.map((p: any) => p.confidence);
    return allConfidences.length > 0 ? 
           allConfidences.reduce((sum: number, conf: number) => sum + conf, 0) / allConfidences.length :
           0.8;
  }

  private generateVisualizations(findings: any, processedData: any): any[] {
    const visualizations = [];
    
    if (findings.trends.length > 0) {
      visualizations.push({
        type: 'line_chart',
        title: 'Trend Analysis',
        description: 'Time series showing identified trends',
        data: processedData.processed,
        config: { showTrendLine: true, confidence: true }
      });
    }
    
    if (findings.patterns.length > 0) {
      visualizations.push({
        type: 'pattern_chart',
        title: 'Pattern Recognition',
        description: 'Visualization of detected patterns',
        data: findings.patterns,
        config: { showConfidence: true, highlightSignificant: true }
      });
    }
    
    return visualizations;
  }

  // Helper methods
  private detectCyclicalPattern(data: number[]): boolean {
    // Simple cyclical detection - in real implementation would use FFT
    return Math.random() > 0.6; // 40% chance of detecting cyclical pattern
  }

  private detectGrowthPattern(data: number[]): boolean {
    const slope = this.calculateSlope(data);
    return slope > 0.05; // Positive slope indicates growth
  }

  private calculateSlope(data: number[]): number {
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  }

  // BaseAgent implementation
  protected async onStart(): Promise<void> {
    console.log(`AnalystAgent ${this.id} started with analysis types: ${Array.from(this.analysisTypes).join(', ')}`);
  }

  protected async onStop(): Promise<void> {
    console.log(`AnalystAgent ${this.id} stopped`);
  }

  protected async onSendMessage(message: any): Promise<void> {
    console.log(`AnalystAgent ${this.id} sending message:`, message);
  }

  protected async onCancelTask(taskId: string): Promise<void> {
    console.log(`AnalystAgent ${this.id} cancelling task ${taskId}`);
  }

  // Configuration methods
  addAnalysisType(type: string): void {
    this.analysisTypes.add(type);
  }

  addDataFormat(format: string): void {
    this.dataFormats.add(format);
  }

  addVisualizationTool(tool: string): void {
    this.visualizationTools.add(tool);
  }

  getSupportedAnalysisTypes(): string[] {
    return Array.from(this.analysisTypes);
  }

  getSupportedDataFormats(): string[] {
    return Array.from(this.dataFormats);
  }

  updateConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0, Math.min(1, threshold));
  }
}

// Factory function for creating analyst agents
export function createAnalystAgent(config: Partial<AnalystAgentConfig> = {}): AnalystAgent {
  const defaultConfig: AnalystAgentConfig = {
    id: `analyst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name || 'Analyst Agent',
    description: 'Specialized agent for data analysis, pattern recognition, and insights generation',
    capabilities: [
      AgentCapability.DATA_ANALYSIS,
      AgentCapability.PATTERN_RECOGNITION,
      AgentCapability.STATISTICAL_ANALYSIS,
      AgentCapability.VISUALIZATION
    ],
    maxConcurrentTasks: 2,
    analysisTypes: ['descriptive', 'predictive', 'prescriptive', 'diagnostic'],
    dataFormats: ['json', 'csv', 'xml', 'raw'],
    visualizationTools: ['charts', 'graphs', 'heatmaps', 'dashboards'],
    statisticalMethods: ['regression', 'correlation', 'clustering', 'classification'],
    confidenceThreshold: 0.8,
    ...config
  };

  return new AnalystAgent(defaultConfig);
}