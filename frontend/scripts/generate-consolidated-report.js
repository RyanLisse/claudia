#!/usr/bin/env node

/**
 * Generate consolidated test report from all test results
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function generateConsolidatedReport(artifactsDir) {
  console.log('Generating consolidated test report...');
  
  const artifactsPath = artifactsDir || path.join(process.cwd(), '..', 'artifacts');
  const reportDir = path.join(process.cwd(), 'consolidated-report');
  
  // Initialize consolidated summary
  const consolidatedSummary = {
    timestamp: new Date().toISOString(),
    testRun: {
      id: process.env.GITHUB_RUN_ID || generateRunId(),
      url: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID 
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : null,
      branch: process.env.GITHUB_REF_NAME || 'unknown',
      commit: process.env.GITHUB_SHA || 'unknown',
      actor: process.env.GITHUB_ACTOR || 'unknown',
      event: process.env.GITHUB_EVENT_NAME || 'unknown'
    },
    overall: {
      status: 'passed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: 0,
      coverage: 0
    },
    e2e: {
      status: 'passed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      browsers: {
        chromium: { passed: 0, failed: 0, skipped: 0 },
        firefox: { passed: 0, failed: 0, skipped: 0 },
        webkit: { passed: 0, failed: 0, skipped: 0 }
      },
      shards: {
        total: 4,
        completed: 0,
        failed: 0
      },
      duration: 0,
      flaky: 0
    },
    accessibility: {
      status: 'passed',
      overallScore: 0,
      grade: 'F',
      wcagCompliance: {
        aa: 0,
        aaa: 0
      },
      keyboardNavigation: 0,
      screenReaderSupport: 0,
      colorContrast: 0,
      focusManagement: 0,
      violations: {
        critical: 0,
        serious: 0,
        moderate: 0,
        minor: 0
      },
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    },
    performance: {
      status: 'passed',
      performanceScore: 0,
      grade: 'F',
      coreWebVitals: {
        fcp: { median: 0, threshold: 1800, score: 0 },
        lcp: { median: 0, threshold: 2500, score: 0 },
        cls: { median: 0, threshold: 0.1, score: 0 },
        fid: { median: 0, threshold: 100, score: 0 },
        tti: { median: 0, threshold: 3800, score: 0 }
      },
      pageMetrics: {
        totalPages: 0,
        pagesWithIssues: 0,
        averageLoadTime: 0
      },
      totalTests: 0,
      passedTests: 0,
      failedTests: 0
    },
    visualRegression: {
      status: 'passed',
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      differences: 0,
      newScreenshots: 0,
      updatedScreenshots: 0
    },
    artifacts: {
      reports: [],
      traces: [],
      screenshots: [],
      videos: []
    },
    issues: [],
    recommendations: []
  };
  
  try {
    // Process E2E test results
    await processE2EResults(artifactsPath, consolidatedSummary);
    
    // Process accessibility results
    await processAccessibilityResults(artifactsPath, consolidatedSummary);
    
    // Process performance results
    await processPerformanceResults(artifactsPath, consolidatedSummary);
    
    // Process visual regression results
    await processVisualRegressionResults(artifactsPath, consolidatedSummary);
    
    // Process artifacts
    await processArtifacts(artifactsPath, consolidatedSummary);
    
    // Calculate overall status and metrics
    calculateOverallMetrics(consolidatedSummary);
    
    // Generate recommendations
    generateRecommendations(consolidatedSummary);
    
    // Write consolidated summary
    const summaryPath = path.join(process.cwd(), 'test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(consolidatedSummary, null, 2));
    
    // Generate HTML report
    await generateConsolidatedHTMLReport(consolidatedSummary, reportDir);
    
    // Generate summary for CI
    generateCISummary(consolidatedSummary);
    
    console.log('Consolidated Report Generated:');
    console.log(`  Overall Status: ${consolidatedSummary.overall.status.toUpperCase()}`);
    console.log(`  Total Tests: ${consolidatedSummary.overall.totalTests}`);
    console.log(`  Passed: ${consolidatedSummary.overall.passedTests}`);
    console.log(`  Failed: ${consolidatedSummary.overall.failedTests}`);
    console.log(`  Accessibility Score: ${(consolidatedSummary.accessibility.overallScore * 100).toFixed(1)}%`);
    console.log(`  Performance Score: ${(consolidatedSummary.performance.performanceScore * 100).toFixed(1)}%`);
    console.log(`  Visual Regression: ${consolidatedSummary.visualRegression.differences} differences`);
    
    return consolidatedSummary;
    
  } catch (error) {
    console.error('Error generating consolidated report:', error);
    
    // Generate basic error report
    consolidatedSummary.overall.status = 'failed';
    consolidatedSummary.issues.push({
      title: 'Report Generation Error',
      description: error.message,
      severity: 'critical',
      category: 'system'
    });
    
    const summaryPath = path.join(process.cwd(), 'test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(consolidatedSummary, null, 2));
    
    return consolidatedSummary;
  }
}

async function processE2EResults(artifactsPath, summary) {
  console.log('Processing E2E test results...');
  
  const e2ePattern = path.join(artifactsPath, '**/test-results-*/**/*.json');
  const e2eFiles = await glob(e2ePattern);
  
  for (const file of e2eFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      
      if (data.suites) {
        // Process Playwright test results
        data.suites.forEach(suite => {
          suite.specs.forEach(spec => {
            summary.e2e.totalTests++;
            summary.overall.totalTests++;
            
            if (spec.ok) {
              summary.e2e.passedTests++;
              summary.overall.passedTests++;
            } else {
              summary.e2e.failedTests++;
              summary.overall.failedTests++;
              summary.e2e.status = 'failed';
            }
            
            // Track browser results
            if (spec.tests && spec.tests.length > 0) {
              const browserName = spec.tests[0].projectName || 'chromium';
              if (summary.e2e.browsers[browserName]) {
                if (spec.ok) {
                  summary.e2e.browsers[browserName].passed++;
                } else {
                  summary.e2e.browsers[browserName].failed++;
                }
              }
            }
          });
        });
      }
      
      // Track flaky tests
      if (data.stats && data.stats.flaky) {
        summary.e2e.flaky += data.stats.flaky;
      }
      
      // Track duration
      if (data.stats && data.stats.duration) {
        summary.e2e.duration += data.stats.duration;
      }
      
    } catch (error) {
      console.error(`Error processing E2E file ${file}:`, error);
    }
  }
  
  // Count completed shards
  const shardPattern = path.join(artifactsPath, '**/test-results-*-shard-*');
  const shardDirs = await glob(shardPattern);
  summary.e2e.shards.completed = shardDirs.length;
  
  if (summary.e2e.failedTests > 0) {
    summary.e2e.shards.failed = Math.min(summary.e2e.failedTests, summary.e2e.shards.total);
  }
}

async function processAccessibilityResults(artifactsPath, summary) {
  console.log('Processing accessibility test results...');
  
  const accessibilityPattern = path.join(artifactsPath, '**/accessibility-*.json');
  const accessibilityFiles = await glob(accessibilityPattern);
  
  // Also check for accessibility summary
  const summaryPattern = path.join(artifactsPath, '**/accessibility-summary.json');
  const summaryFiles = await glob(summaryPattern);
  
  for (const file of [...accessibilityFiles, ...summaryFiles]) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      
      if (data.overallScore !== undefined) {
        // This is a summary file
        summary.accessibility.overallScore = data.overallScore;
        summary.accessibility.grade = data.grade;
        summary.accessibility.status = data.status;
        
        if (data.wcagCompliance) {
          summary.accessibility.wcagCompliance = data.wcagCompliance;
        }
        
        if (data.keyboardNavigation) {
          summary.accessibility.keyboardNavigation = data.keyboardNavigation.score;
        }
        
        if (data.screenReaderSupport) {
          summary.accessibility.screenReaderSupport = data.screenReaderSupport.score;
        }
        
        if (data.colorContrast) {
          summary.accessibility.colorContrast = data.colorContrast.score;
        }
        
        if (data.focusManagement) {
          summary.accessibility.focusManagement = data.focusManagement.score;
        }
        
        if (data.violations) {
          summary.accessibility.violations = data.violations;
        }
        
        summary.accessibility.totalTests = data.totalTests || 0;
        summary.accessibility.passedTests = data.passedTests || 0;
        summary.accessibility.failedTests = data.failedTests || 0;
      }
      
    } catch (error) {
      console.error(`Error processing accessibility file ${file}:`, error);
    }
  }
}

async function processPerformanceResults(artifactsPath, summary) {
  console.log('Processing performance test results...');
  
  const performancePattern = path.join(artifactsPath, '**/performance-*.json');
  const performanceFiles = await glob(performancePattern);
  
  // Also check for performance summary
  const summaryPattern = path.join(artifactsPath, '**/performance-summary.json');
  const summaryFiles = await glob(summaryPattern);
  
  for (const file of [...performanceFiles, ...summaryFiles]) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      
      if (data.performanceScore !== undefined) {
        // This is a summary file
        summary.performance.performanceScore = data.performanceScore;
        summary.performance.grade = data.performanceGrade;
        summary.performance.status = data.status;
        
        if (data.coreWebVitals) {
          summary.performance.coreWebVitals = data.coreWebVitals;
        }
        
        if (data.pageMetrics) {
          summary.performance.pageMetrics = data.pageMetrics;
        }
        
        summary.performance.totalTests = data.totalTests || 0;
        summary.performance.passedTests = data.passedTests || 0;
        summary.performance.failedTests = data.failedTests || 0;
      }
      
    } catch (error) {
      console.error(`Error processing performance file ${file}:`, error);
    }
  }
}

async function processVisualRegressionResults(artifactsPath, summary) {
  console.log('Processing visual regression test results...');
  
  const visualPattern = path.join(artifactsPath, '**/visual-regression-*.json');
  const visualFiles = await glob(visualPattern);
  
  for (const file of visualFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const data = JSON.parse(content);
      
      summary.visualRegression.totalTests += data.totalTests || 0;
      summary.visualRegression.passedTests += data.passedTests || 0;
      summary.visualRegression.failedTests += data.failedTests || 0;
      summary.visualRegression.differences += data.differences || 0;
      summary.visualRegression.newScreenshots += data.newScreenshots || 0;
      summary.visualRegression.updatedScreenshots += data.updatedScreenshots || 0;
      
    } catch (error) {
      console.error(`Error processing visual regression file ${file}:`, error);
    }
  }
  
  if (summary.visualRegression.failedTests > 0 || summary.visualRegression.differences > 0) {
    summary.visualRegression.status = 'failed';
  }
}

async function processArtifacts(artifactsPath, summary) {
  console.log('Processing artifacts...');
  
  try {
    // Find HTML reports
    const reportPattern = path.join(artifactsPath, '**/*.html');
    const reportFiles = await glob(reportPattern);
    summary.artifacts.reports = reportFiles.map(f => path.relative(artifactsPath, f));
    
    // Find trace files
    const tracePattern = path.join(artifactsPath, '**/trace-*.zip');
    const traceFiles = await glob(tracePattern);
    summary.artifacts.traces = traceFiles.map(f => path.relative(artifactsPath, f));
    
    // Find screenshots
    const screenshotPattern = path.join(artifactsPath, '**/*.png');
    const screenshotFiles = await glob(screenshotPattern);
    summary.artifacts.screenshots = screenshotFiles.map(f => path.relative(artifactsPath, f));
    
    // Find videos
    const videoPattern = path.join(artifactsPath, '**/*.webm');
    const videoFiles = await glob(videoPattern);
    summary.artifacts.videos = videoFiles.map(f => path.relative(artifactsPath, f));
    
  } catch (error) {
    console.error('Error processing artifacts:', error);
  }
}

function calculateOverallMetrics(summary) {
  // Calculate overall totals
  summary.overall.totalTests = 
    summary.e2e.totalTests + 
    summary.accessibility.totalTests + 
    summary.performance.totalTests + 
    summary.visualRegression.totalTests;
  
  summary.overall.passedTests = 
    summary.e2e.passedTests + 
    summary.accessibility.passedTests + 
    summary.performance.passedTests + 
    summary.visualRegression.passedTests;
  
  summary.overall.failedTests = 
    summary.e2e.failedTests + 
    summary.accessibility.failedTests + 
    summary.performance.failedTests + 
    summary.visualRegression.failedTests;
  
  summary.overall.skippedTests = 
    summary.e2e.skippedTests + 
    summary.accessibility.skippedTests + 
    summary.performance.skippedTests + 
    summary.visualRegression.skippedTests;
  
  // Calculate overall duration
  summary.overall.duration = summary.e2e.duration;
  
  // Calculate overall coverage (if available)
  summary.overall.coverage = 0; // TODO: Add coverage calculation
  
  // Determine overall status
  if (summary.e2e.status === 'failed' || 
      summary.accessibility.status === 'failed' || 
      summary.performance.status === 'failed' || 
      summary.visualRegression.status === 'failed') {
    summary.overall.status = 'failed';
  }
  
  // Add critical issues to overall issues
  if (summary.accessibility.violations.critical > 0) {
    summary.issues.push({
      title: 'Critical Accessibility Violations',
      description: `Found ${summary.accessibility.violations.critical} critical accessibility violations`,
      severity: 'critical',
      category: 'accessibility'
    });
  }
  
  if (summary.performance.performanceScore < 0.5) {
    summary.issues.push({
      title: 'Poor Performance Score',
      description: `Performance score of ${(summary.performance.performanceScore * 100).toFixed(1)}% is below acceptable threshold`,
      severity: 'major',
      category: 'performance'
    });
  }
  
  if (summary.visualRegression.differences > 0) {
    summary.issues.push({
      title: 'Visual Regression Detected',
      description: `Found ${summary.visualRegression.differences} visual differences`,
      severity: 'minor',
      category: 'visual'
    });
  }
}

function generateRecommendations(summary) {
  // Generate recommendations based on results
  if (summary.accessibility.overallScore < 0.8) {
    summary.recommendations.push({
      title: 'Improve Accessibility',
      description: 'Focus on improving keyboard navigation, screen reader support, and color contrast',
      priority: 'high',
      category: 'accessibility'
    });
  }
  
  if (summary.performance.performanceScore < 0.7) {
    summary.recommendations.push({
      title: 'Optimize Performance',
      description: 'Focus on improving Core Web Vitals, especially LCP and FCP',
      priority: 'high',
      category: 'performance'
    });
  }
  
  if (summary.e2e.flaky > 0) {
    summary.recommendations.push({
      title: 'Fix Flaky Tests',
      description: `Address ${summary.e2e.flaky} flaky tests to improve test reliability`,
      priority: 'medium',
      category: 'testing'
    });
  }
  
  if (summary.visualRegression.differences > 5) {
    summary.recommendations.push({
      title: 'Review Visual Changes',
      description: 'Review and approve significant visual changes',
      priority: 'medium',
      category: 'visual'
    });
  }
}

async function generateConsolidatedHTMLReport(summary, reportDir) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Consolidated Test Report</title>
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
        .status {
            font-size: 24px;
            font-weight: bold;
            padding: 10px 20px;
            border-radius: 8px;
            display: inline-block;
            margin-bottom: 20px;
            color: white;
            background: ${summary.overall.status === 'passed' ? '#22c55e' : '#ef4444'};
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .metric-value {
            font-weight: bold;
            color: #2563eb;
        }
        .test-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        .progress-fill {
            height: 100%;
            background: #22c55e;
            transition: width 0.3s ease;
        }
        .issues {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .issue-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .issue-item:last-child {
            border-bottom: none;
        }
        .issue-severity {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            margin-right: 10px;
        }
        .critical { background: #dc2626; }
        .major { background: #ea580c; }
        .minor { background: #65a30d; }
        .timestamp {
            color: #666;
            font-size: 14px;
            margin-top: 20px;
        }
        .artifacts {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .artifact-list {
            list-style: none;
            padding: 0;
        }
        .artifact-list li {
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }
        .artifact-list a {
            color: #2563eb;
            text-decoration: none;
        }
        .artifact-list a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Consolidated Test Report</h1>
        <div class="status">${summary.overall.status.toUpperCase()}</div>
        <p><strong>Test Run:</strong> ${summary.testRun.id}</p>
        <p><strong>Branch:</strong> ${summary.testRun.branch}</p>
        <p><strong>Commit:</strong> ${summary.testRun.commit.substring(0, 8)}</p>
        <p><strong>Actor:</strong> ${summary.testRun.actor}</p>
    </div>
    
    <div class="summary-grid">
        <div class="summary-card">
            <div class="card-title">Overall Results</div>
            <div class="metric">
                <span>Total Tests:</span>
                <span class="metric-value">${summary.overall.totalTests}</span>
            </div>
            <div class="metric">
                <span>Passed:</span>
                <span class="metric-value">${summary.overall.passedTests}</span>
            </div>
            <div class="metric">
                <span>Failed:</span>
                <span class="metric-value">${summary.overall.failedTests}</span>
            </div>
            <div class="metric">
                <span>Success Rate:</span>
                <span class="metric-value">${summary.overall.totalTests ? ((summary.overall.passedTests / summary.overall.totalTests) * 100).toFixed(1) : 0}%</span>
            </div>
        </div>
        
        <div class="summary-card">
            <div class="card-title">Accessibility</div>
            <div class="metric">
                <span>Score:</span>
                <span class="metric-value">${(summary.accessibility.overallScore * 100).toFixed(1)}% (${summary.accessibility.grade})</span>
            </div>
            <div class="metric">
                <span>WCAG 2.1 AA:</span>
                <span class="metric-value">${(summary.accessibility.wcagCompliance.aa * 100).toFixed(1)}%</span>
            </div>
            <div class="metric">
                <span>Critical Issues:</span>
                <span class="metric-value">${summary.accessibility.violations.critical}</span>
            </div>
        </div>
        
        <div class="summary-card">
            <div class="card-title">Performance</div>
            <div class="metric">
                <span>Score:</span>
                <span class="metric-value">${(summary.performance.performanceScore * 100).toFixed(1)}% (${summary.performance.grade})</span>
            </div>
            <div class="metric">
                <span>FCP:</span>
                <span class="metric-value">${summary.performance.coreWebVitals.fcp.median}ms</span>
            </div>
            <div class="metric">
                <span>LCP:</span>
                <span class="metric-value">${summary.performance.coreWebVitals.lcp.median}ms</span>
            </div>
            <div class="metric">
                <span>CLS:</span>
                <span class="metric-value">${summary.performance.coreWebVitals.cls.median.toFixed(3)}</span>
            </div>
        </div>
        
        <div class="summary-card">
            <div class="card-title">Visual Regression</div>
            <div class="metric">
                <span>Tests:</span>
                <span class="metric-value">${summary.visualRegression.totalTests}</span>
            </div>
            <div class="metric">
                <span>Differences:</span>
                <span class="metric-value">${summary.visualRegression.differences}</span>
            </div>
            <div class="metric">
                <span>New Screenshots:</span>
                <span class="metric-value">${summary.visualRegression.newScreenshots}</span>
            </div>
        </div>
    </div>
    
    <div class="test-section">
        <h2>E2E Tests</h2>
        <div class="progress-bar">
            <div class="progress-fill" style="width: ${summary.e2e.totalTests ? (summary.e2e.passedTests / summary.e2e.totalTests) * 100 : 0}%"></div>
        </div>
        <p>${summary.e2e.passedTests} / ${summary.e2e.totalTests} tests passed</p>
        <p><strong>Browsers:</strong> 
            Chromium (${summary.e2e.browsers.chromium.passed}/${summary.e2e.browsers.chromium.passed + summary.e2e.browsers.chromium.failed}), 
            Firefox (${summary.e2e.browsers.firefox.passed}/${summary.e2e.browsers.firefox.passed + summary.e2e.browsers.firefox.failed}), 
            WebKit (${summary.e2e.browsers.webkit.passed}/${summary.e2e.browsers.webkit.passed + summary.e2e.browsers.webkit.failed})
        </p>
        <p><strong>Shards:</strong> ${summary.e2e.shards.completed} / ${summary.e2e.shards.total} completed</p>
        ${summary.e2e.flaky > 0 ? `<p><strong>Flaky Tests:</strong> ${summary.e2e.flaky}</p>` : ''}
    </div>
    
    ${summary.issues.length > 0 ? `
    <div class="issues">
        <h2>Issues Found</h2>
        ${summary.issues.map(issue => `
            <div class="issue-item">
                <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <strong>${issue.title}</strong>
                <p>${issue.description}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${summary.recommendations.length > 0 ? `
    <div class="issues">
        <h2>Recommendations</h2>
        ${summary.recommendations.map(rec => `
            <div class="issue-item">
                <strong>${rec.title}</strong>
                <p>${rec.description}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    <div class="artifacts">
        <h2>Test Artifacts</h2>
        
        ${summary.artifacts.reports.length > 0 ? `
        <h3>Reports</h3>
        <ul class="artifact-list">
            ${summary.artifacts.reports.map(report => `
                <li><a href="${report}">${report}</a></li>
            `).join('')}
        </ul>
        ` : ''}
        
        ${summary.artifacts.traces.length > 0 ? `
        <h3>Traces</h3>
        <ul class="artifact-list">
            ${summary.artifacts.traces.slice(0, 10).map(trace => `
                <li><a href="${trace}">${trace}</a></li>
            `).join('')}
            ${summary.artifacts.traces.length > 10 ? `<li>... and ${summary.artifacts.traces.length - 10} more</li>` : ''}
        </ul>
        ` : ''}
        
        ${summary.artifacts.screenshots.length > 0 ? `
        <h3>Screenshots</h3>
        <ul class="artifact-list">
            ${summary.artifacts.screenshots.slice(0, 10).map(screenshot => `
                <li><a href="${screenshot}">${screenshot}</a></li>
            `).join('')}
            ${summary.artifacts.screenshots.length > 10 ? `<li>... and ${summary.artifacts.screenshots.length - 10} more</li>` : ''}
        </ul>
        ` : ''}
    </div>
    
    <div class="timestamp">
        Generated on ${new Date(summary.timestamp).toLocaleString()}
    </div>
</body>
</html>
  `;
  
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'index.html');
  fs.writeFileSync(reportPath, htmlTemplate);
  
  console.log(`HTML report generated: ${reportPath}`);
}

function generateCISummary(summary) {
  const ciSummary = {
    status: summary.overall.status,
    totalTests: summary.overall.totalTests,
    passedTests: summary.overall.passedTests,
    failedTests: summary.overall.failedTests,
    accessibility: {
      score: summary.accessibility.overallScore,
      grade: summary.accessibility.grade,
      wcagCompliance: summary.accessibility.wcagCompliance.aa,
      criticalViolations: summary.accessibility.violations.critical
    },
    performance: {
      score: summary.performance.performanceScore,
      grade: summary.performance.grade,
      fcp: summary.performance.coreWebVitals.fcp.median,
      lcp: summary.performance.coreWebVitals.lcp.median,
      cls: summary.performance.coreWebVitals.cls.median
    },
    visualRegression: {
      differences: summary.visualRegression.differences,
      newScreenshots: summary.visualRegression.newScreenshots
    },
    issues: summary.issues.filter(issue => issue.severity === 'critical').length,
    recommendations: summary.recommendations.length
  };
  
  const ciSummaryPath = path.join(process.cwd(), 'ci-summary.json');
  fs.writeFileSync(ciSummaryPath, JSON.stringify(ciSummary, null, 2));
  
  console.log(`CI summary generated: ${ciSummaryPath}`);
}

function generateRunId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Run if called directly
if (require.main === module) {
  const artifactsDir = process.argv[2];
  generateConsolidatedReport(artifactsDir).catch(console.error);
}

module.exports = { generateConsolidatedReport };