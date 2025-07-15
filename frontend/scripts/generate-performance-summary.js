#!/usr/bin/env node

/**
 * Generate performance summary from test results
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function generatePerformanceSummary() {
  console.log('Generating performance summary...');
  
  const resultsDir = path.join(process.cwd(), 'test-results');
  const reportDir = path.join(process.cwd(), 'performance-report');
  
  // Find all performance test result files
  const performanceFiles = await glob('**/performance-*.json', { cwd: resultsDir });
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    coreWebVitals: {
      fcp: {
        median: 0,
        p95: 0,
        threshold: 1800,
        passed: 0,
        total: 0,
        score: 0
      },
      lcp: {
        median: 0,
        p95: 0,
        threshold: 2500,
        passed: 0,
        total: 0,
        score: 0
      },
      cls: {
        median: 0,
        p95: 0,
        threshold: 0.1,
        passed: 0,
        total: 0,
        score: 0
      },
      fid: {
        median: 0,
        p95: 0,
        threshold: 100,
        passed: 0,
        total: 0,
        score: 0
      },
      tti: {
        median: 0,
        p95: 0,
        threshold: 3800,
        passed: 0,
        total: 0,
        score: 0
      },
      si: {
        median: 0,
        p95: 0,
        threshold: 3400,
        passed: 0,
        total: 0,
        score: 0
      }
    },
    pageMetrics: {
      totalPages: 0,
      pagesWithIssues: 0,
      averageLoadTime: 0,
      averageScriptEvaluationTime: 0,
      averageNetworkTime: 0,
      averageRenderTime: 0
    },
    resourceMetrics: {
      totalRequests: 0,
      totalSize: 0,
      averageRequestSize: 0,
      cacheHitRate: 0,
      compressionRate: 0,
      unusedCSS: 0,
      unusedJS: 0
    },
    performanceScore: 0,
    performanceGrade: 'F',
    issues: [],
    recommendations: [],
    pageResults: []
  };
  
  // Collect all metrics for calculation
  const allMetrics = {
    fcp: [],
    lcp: [],
    cls: [],
    fid: [],
    tti: [],
    si: [],
    loadTimes: [],
    scriptTimes: [],
    networkTimes: [],
    renderTimes: []
  };
  
  // Process each performance result file
  for (const file of performanceFiles) {
    const filePath = path.join(resultsDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Aggregate test counts
      summary.totalTests += data.totalTests || 0;
      summary.passedTests += data.passedTests || 0;
      summary.failedTests += data.failedTests || 0;
      summary.skippedTests += data.skippedTests || 0;
      
      // Collect Core Web Vitals data
      if (data.coreWebVitals) {
        ['fcp', 'lcp', 'cls', 'fid', 'tti', 'si'].forEach(metric => {
          if (data.coreWebVitals[metric]) {
            allMetrics[metric].push(...(data.coreWebVitals[metric].values || []));
            summary.coreWebVitals[metric].total += data.coreWebVitals[metric].total || 0;
            summary.coreWebVitals[metric].passed += data.coreWebVitals[metric].passed || 0;
          }
        });
      }
      
      // Collect page metrics
      if (data.pageMetrics) {
        summary.pageMetrics.totalPages += data.pageMetrics.totalPages || 0;
        summary.pageMetrics.pagesWithIssues += data.pageMetrics.pagesWithIssues || 0;
        
        if (data.pageMetrics.loadTimes) {
          allMetrics.loadTimes.push(...data.pageMetrics.loadTimes);
        }
        if (data.pageMetrics.scriptTimes) {
          allMetrics.scriptTimes.push(...data.pageMetrics.scriptTimes);
        }
        if (data.pageMetrics.networkTimes) {
          allMetrics.networkTimes.push(...data.pageMetrics.networkTimes);
        }
        if (data.pageMetrics.renderTimes) {
          allMetrics.renderTimes.push(...data.pageMetrics.renderTimes);
        }
      }
      
      // Collect resource metrics
      if (data.resourceMetrics) {
        summary.resourceMetrics.totalRequests += data.resourceMetrics.totalRequests || 0;
        summary.resourceMetrics.totalSize += data.resourceMetrics.totalSize || 0;
        summary.resourceMetrics.cacheHitRate += data.resourceMetrics.cacheHitRate || 0;
        summary.resourceMetrics.compressionRate += data.resourceMetrics.compressionRate || 0;
        summary.resourceMetrics.unusedCSS += data.resourceMetrics.unusedCSS || 0;
        summary.resourceMetrics.unusedJS += data.resourceMetrics.unusedJS || 0;
      }
      
      // Add page results
      if (data.pageResults) {
        summary.pageResults.push(...data.pageResults);
      }
      
      // Add issues
      if (data.issues) {
        summary.issues.push(...data.issues);
      }
      
      // Add recommendations
      if (data.recommendations) {
        summary.recommendations.push(...data.recommendations);
      }
      
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  // Calculate medians and percentiles
  ['fcp', 'lcp', 'cls', 'fid', 'tti', 'si'].forEach(metric => {
    const values = allMetrics[metric].filter(v => v !== null && v !== undefined);
    if (values.length > 0) {
      values.sort((a, b) => a - b);
      summary.coreWebVitals[metric].median = getPercentile(values, 50);
      summary.coreWebVitals[metric].p95 = getPercentile(values, 95);
      
      // Calculate score based on threshold
      const threshold = summary.coreWebVitals[metric].threshold;
      const passedCount = values.filter(v => v <= threshold).length;
      summary.coreWebVitals[metric].score = passedCount / values.length;
    }
  });
  
  // Calculate page metrics averages
  summary.pageMetrics.averageLoadTime = calculateAverage(allMetrics.loadTimes);
  summary.pageMetrics.averageScriptEvaluationTime = calculateAverage(allMetrics.scriptTimes);
  summary.pageMetrics.averageNetworkTime = calculateAverage(allMetrics.networkTimes);
  summary.pageMetrics.averageRenderTime = calculateAverage(allMetrics.renderTimes);
  
  // Calculate resource metrics averages
  const totalFiles = performanceFiles.length || 1;
  summary.resourceMetrics.averageRequestSize = 
    summary.resourceMetrics.totalSize / summary.resourceMetrics.totalRequests;
  summary.resourceMetrics.cacheHitRate = summary.resourceMetrics.cacheHitRate / totalFiles;
  summary.resourceMetrics.compressionRate = summary.resourceMetrics.compressionRate / totalFiles;
  
  // Calculate overall performance score
  const fcpScore = summary.coreWebVitals.fcp.score;
  const lcpScore = summary.coreWebVitals.lcp.score;
  const clsScore = summary.coreWebVitals.cls.score;
  const fidScore = summary.coreWebVitals.fid.score;
  const ttiScore = summary.coreWebVitals.tti.score;
  const siScore = summary.coreWebVitals.si.score;
  
  // Weight according to Core Web Vitals importance
  summary.performanceScore = (
    fcpScore * 0.15 +
    lcpScore * 0.25 +
    clsScore * 0.25 +
    fidScore * 0.25 +
    ttiScore * 0.05 +
    siScore * 0.05
  );
  
  summary.performanceGrade = getPerformanceGrade(summary.performanceScore);
  
  // Generate status
  const criticalIssues = summary.issues.filter(issue => issue.severity === 'critical').length;
  const majorIssues = summary.issues.filter(issue => issue.severity === 'major').length;
  
  summary.status = summary.failedTests === 0 && criticalIssues === 0 && majorIssues < 3 ? 'passed' : 'failed';
  
  // Write summary to file
  const summaryPath = path.join(process.cwd(), 'performance-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate HTML report
  generatePerformanceHTMLReport(summary);
  
  console.log('Performance Summary Generated:');
  console.log(`  Performance Score: ${(summary.performanceScore * 100).toFixed(1)}% (${summary.performanceGrade})`);
  console.log(`  Total Tests: ${summary.totalTests}`);
  console.log(`  Passed: ${summary.passedTests}`);
  console.log(`  Failed: ${summary.failedTests}`);
  console.log(`  FCP Median: ${summary.coreWebVitals.fcp.median}ms`);
  console.log(`  LCP Median: ${summary.coreWebVitals.lcp.median}ms`);
  console.log(`  CLS Median: ${summary.coreWebVitals.cls.median}`);
  console.log(`  Status: ${summary.status.toUpperCase()}`);
  
  return summary;
}

function getPercentile(values, percentile) {
  const index = Math.ceil((percentile / 100) * values.length) - 1;
  return values[Math.max(0, Math.min(index, values.length - 1))];
}

function calculateAverage(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

function getPerformanceGrade(score) {
  if (score >= 0.90) return 'A';
  if (score >= 0.80) return 'B';
  if (score >= 0.70) return 'C';
  if (score >= 0.60) return 'D';
  return 'F';
}

function generatePerformanceHTMLReport(summary) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .grade {
            font-size: 48px;
            font-weight: bold;
            color: ${getGradeColor(summary.performanceGrade)};
            margin-bottom: 10px;
        }
        .score {
            font-size: 24px;
            color: #666;
            margin-bottom: 20px;
        }
        .status {
            padding: 8px 16px;
            border-radius: 4px;
            font-weight: bold;
            display: inline-block;
            background: ${summary.status === 'passed' ? '#22c55e' : '#ef4444'};
            color: white;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #2563eb;
        }
        .metric-description {
            color: #666;
            margin-top: 5px;
        }
        .core-web-vitals {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        .vital-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .vital-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .vital-score {
            font-size: 24px;
            font-weight: bold;
            color: ${summary.performanceScore > 0.8 ? '#22c55e' : summary.performanceScore > 0.6 ? '#f59e0b' : '#ef4444'};
        }
        .vital-threshold {
            color: #666;
            font-size: 14px;
        }
        .issues-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .issue-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .issue-severity {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
        }
        .critical { background: #dc2626; }
        .major { background: #ea580c; }
        .minor { background: #65a30d; }
        .info { background: #2563eb; }
        .recommendations {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .recommendation-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .recommendation-item:last-child {
            border-bottom: none;
        }
        .timestamp {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Test Report</h1>
        <div class="grade">${summary.performanceGrade}</div>
        <div class="score">${(summary.performanceScore * 100).toFixed(1)}% Performance Score</div>
        <div class="status">${summary.status.toUpperCase()}</div>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-title">Total Tests</div>
            <div class="metric-value">${summary.totalTests}</div>
            <div class="metric-description">${summary.passedTests} passed, ${summary.failedTests} failed</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Pages Tested</div>
            <div class="metric-value">${summary.pageMetrics.totalPages}</div>
            <div class="metric-description">${summary.pageMetrics.pagesWithIssues} with performance issues</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Average Load Time</div>
            <div class="metric-value">${summary.pageMetrics.averageLoadTime.toFixed(0)}ms</div>
            <div class="metric-description">Time to fully load pages</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Total Requests</div>
            <div class="metric-value">${summary.resourceMetrics.totalRequests}</div>
            <div class="metric-description">${(summary.resourceMetrics.totalSize / 1024 / 1024).toFixed(1)}MB total size</div>
        </div>
    </div>
    
    <h2>Core Web Vitals</h2>
    <div class="core-web-vitals">
        <div class="vital-card">
            <div class="vital-name">First Contentful Paint</div>
            <div class="vital-score">${summary.coreWebVitals.fcp.median}ms</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.fcp.threshold}ms</div>
        </div>
        
        <div class="vital-card">
            <div class="vital-name">Largest Contentful Paint</div>
            <div class="vital-score">${summary.coreWebVitals.lcp.median}ms</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.lcp.threshold}ms</div>
        </div>
        
        <div class="vital-card">
            <div class="vital-name">Cumulative Layout Shift</div>
            <div class="vital-score">${summary.coreWebVitals.cls.median.toFixed(3)}</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.cls.threshold}</div>
        </div>
        
        <div class="vital-card">
            <div class="vital-name">First Input Delay</div>
            <div class="vital-score">${summary.coreWebVitals.fid.median}ms</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.fid.threshold}ms</div>
        </div>
        
        <div class="vital-card">
            <div class="vital-name">Time to Interactive</div>
            <div class="vital-score">${summary.coreWebVitals.tti.median}ms</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.tti.threshold}ms</div>
        </div>
        
        <div class="vital-card">
            <div class="vital-name">Speed Index</div>
            <div class="vital-score">${summary.coreWebVitals.si.median}ms</div>
            <div class="vital-threshold">Threshold: &lt;${summary.coreWebVitals.si.threshold}ms</div>
        </div>
    </div>
    
    ${summary.issues.length > 0 ? `
    <div class="issues-section">
        <h2>Performance Issues</h2>
        ${summary.issues.map(issue => `
            <div class="issue-item">
                <div>
                    <strong>${issue.title}</strong><br>
                    <span style="color: #666;">${issue.description}</span>
                </div>
                <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${summary.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Performance Recommendations</h2>
        ${summary.recommendations.map(rec => `
            <div class="recommendation-item">
                <strong>${rec.title}</strong><br>
                ${rec.description}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div class="timestamp">
        Generated on ${new Date(summary.timestamp).toLocaleString()}
    </div>
</body>
</html>
  `;
  
  const reportPath = path.join(process.cwd(), 'performance-report', 'index.html');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, htmlTemplate);
}

function getGradeColor(grade) {
  const colors = {
    'A': '#22c55e',
    'B': '#84cc16',
    'C': '#f59e0b',
    'D': '#f97316',
    'F': '#dc2626'
  };
  return colors[grade] || '#6b7280';
}

// Run if called directly
if (require.main === module) {
  generatePerformanceSummary().catch(console.error);
}

module.exports = { generatePerformanceSummary };