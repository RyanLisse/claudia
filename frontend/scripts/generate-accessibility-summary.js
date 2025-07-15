#!/usr/bin/env node

/**
 * Generate accessibility summary from test results
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function generateAccessibilitySummary() {
  console.log('Generating accessibility summary...');
  
  const resultsDir = path.join(process.cwd(), 'test-results');
  const reportDir = path.join(process.cwd(), 'accessibility-report');
  
  // Find all accessibility test result files
  const accessibilityFiles = await glob('**/accessibility-*.json', { cwd: resultsDir });
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    skippedTests: 0,
    wcagCompliance: {
      aa: 0,
      aaa: 0,
      total: 0
    },
    keyboardNavigation: {
      score: 0,
      tests: 0,
      passed: 0
    },
    screenReaderSupport: {
      score: 0,
      tests: 0,
      passed: 0
    },
    colorContrast: {
      score: 0,
      tests: 0,
      passed: 0
    },
    focusManagement: {
      score: 0,
      tests: 0,
      passed: 0
    },
    violations: {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0
    },
    pageResults: [],
    recommendations: []
  };
  
  // Process each accessibility result file
  for (const file of accessibilityFiles) {
    const filePath = path.join(resultsDir, file);
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      // Aggregate test counts
      summary.totalTests += data.totalTests || 0;
      summary.passedTests += data.passedTests || 0;
      summary.failedTests += data.failedTests || 0;
      summary.skippedTests += data.skippedTests || 0;
      
      // Aggregate WCAG compliance
      if (data.wcagCompliance) {
        summary.wcagCompliance.aa += data.wcagCompliance.aa || 0;
        summary.wcagCompliance.aaa += data.wcagCompliance.aaa || 0;
        summary.wcagCompliance.total += 1;
      }
      
      // Aggregate keyboard navigation
      if (data.keyboardNavigation) {
        summary.keyboardNavigation.score += data.keyboardNavigation.score || 0;
        summary.keyboardNavigation.tests += data.keyboardNavigation.tests || 0;
        summary.keyboardNavigation.passed += data.keyboardNavigation.passed || 0;
      }
      
      // Aggregate screen reader support
      if (data.screenReaderSupport) {
        summary.screenReaderSupport.score += data.screenReaderSupport.score || 0;
        summary.screenReaderSupport.tests += data.screenReaderSupport.tests || 0;
        summary.screenReaderSupport.passed += data.screenReaderSupport.passed || 0;
      }
      
      // Aggregate color contrast
      if (data.colorContrast) {
        summary.colorContrast.score += data.colorContrast.score || 0;
        summary.colorContrast.tests += data.colorContrast.tests || 0;
        summary.colorContrast.passed += data.colorContrast.passed || 0;
      }
      
      // Aggregate focus management
      if (data.focusManagement) {
        summary.focusManagement.score += data.focusManagement.score || 0;
        summary.focusManagement.tests += data.focusManagement.tests || 0;
        summary.focusManagement.passed += data.focusManagement.passed || 0;
      }
      
      // Aggregate violations
      if (data.violations) {
        summary.violations.critical += data.violations.critical || 0;
        summary.violations.serious += data.violations.serious || 0;
        summary.violations.moderate += data.violations.moderate || 0;
        summary.violations.minor += data.violations.minor || 0;
      }
      
      // Add page results
      if (data.pageResults) {
        summary.pageResults.push(...data.pageResults);
      }
      
      // Add recommendations
      if (data.recommendations) {
        summary.recommendations.push(...data.recommendations);
      }
      
    } catch (error) {
      console.error(`Error processing file ${file}:`, error);
    }
  }
  
  // Calculate averages
  const totalFiles = accessibilityFiles.length || 1;
  
  summary.wcagCompliance.aa = summary.wcagCompliance.aa / summary.wcagCompliance.total;
  summary.wcagCompliance.aaa = summary.wcagCompliance.aaa / summary.wcagCompliance.total;
  
  summary.keyboardNavigation.score = summary.keyboardNavigation.score / totalFiles;
  summary.screenReaderSupport.score = summary.screenReaderSupport.score / totalFiles;
  summary.colorContrast.score = summary.colorContrast.score / totalFiles;
  summary.focusManagement.score = summary.focusManagement.score / totalFiles;
  
  // Generate overall score
  const overallScore = (
    summary.wcagCompliance.aa * 0.3 +
    summary.keyboardNavigation.score * 0.25 +
    summary.screenReaderSupport.score * 0.25 +
    summary.colorContrast.score * 0.2
  );
  
  summary.overallScore = overallScore;
  summary.grade = getAccessibilityGrade(overallScore);
  
  // Generate status
  summary.status = summary.failedTests === 0 && summary.violations.critical === 0 ? 'passed' : 'failed';
  
  // Write summary to file
  const summaryPath = path.join(process.cwd(), 'accessibility-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  // Generate HTML report
  generateAccessibilityHTMLReport(summary);
  
  console.log('Accessibility Summary Generated:');
  console.log(`  Overall Score: ${(overallScore * 100).toFixed(1)}% (${summary.grade})`);
  console.log(`  Total Tests: ${summary.totalTests}`);
  console.log(`  Passed: ${summary.passedTests}`);
  console.log(`  Failed: ${summary.failedTests}`);
  console.log(`  WCAG 2.1 AA: ${(summary.wcagCompliance.aa * 100).toFixed(1)}%`);
  console.log(`  Critical Violations: ${summary.violations.critical}`);
  console.log(`  Status: ${summary.status.toUpperCase()}`);
  
  return summary;
}

function getAccessibilityGrade(score) {
  if (score >= 0.95) return 'A+';
  if (score >= 0.90) return 'A';
  if (score >= 0.85) return 'B+';
  if (score >= 0.80) return 'B';
  if (score >= 0.75) return 'C+';
  if (score >= 0.70) return 'C';
  if (score >= 0.65) return 'D+';
  if (score >= 0.60) return 'D';
  return 'F';
}

function generateAccessibilityHTMLReport(summary) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
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
            color: ${getGradeColor(summary.grade)};
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
        .violations-section {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        .violation-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .violation-type {
            font-weight: bold;
        }
        .violation-count {
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
            color: white;
        }
        .critical { background: #dc2626; }
        .serious { background: #ea580c; }
        .moderate { background: #d97706; }
        .minor { background: #65a30d; }
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
        <h1>Accessibility Test Report</h1>
        <div class="grade">${summary.grade}</div>
        <div class="score">${(summary.overallScore * 100).toFixed(1)}% Overall Score</div>
        <div class="status">${summary.status.toUpperCase()}</div>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-title">Total Tests</div>
            <div class="metric-value">${summary.totalTests}</div>
            <div class="metric-description">${summary.passedTests} passed, ${summary.failedTests} failed</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">WCAG 2.1 AA</div>
            <div class="metric-value">${(summary.wcagCompliance.aa * 100).toFixed(1)}%</div>
            <div class="metric-description">Web Content Accessibility Guidelines</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Keyboard Navigation</div>
            <div class="metric-value">${(summary.keyboardNavigation.score * 100).toFixed(1)}%</div>
            <div class="metric-description">Tab and arrow key navigation</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Screen Reader Support</div>
            <div class="metric-value">${(summary.screenReaderSupport.score * 100).toFixed(1)}%</div>
            <div class="metric-description">ARIA labels and semantic markup</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Color Contrast</div>
            <div class="metric-value">${(summary.colorContrast.score * 100).toFixed(1)}%</div>
            <div class="metric-description">WCAG contrast ratio compliance</div>
        </div>
        
        <div class="metric-card">
            <div class="metric-title">Focus Management</div>
            <div class="metric-value">${(summary.focusManagement.score * 100).toFixed(1)}%</div>
            <div class="metric-description">Focus trapping and restoration</div>
        </div>
    </div>
    
    <div class="violations-section">
        <h2>Accessibility Violations</h2>
        <div class="violation-item">
            <span class="violation-type">Critical</span>
            <span class="violation-count critical">${summary.violations.critical}</span>
        </div>
        <div class="violation-item">
            <span class="violation-type">Serious</span>
            <span class="violation-count serious">${summary.violations.serious}</span>
        </div>
        <div class="violation-item">
            <span class="violation-type">Moderate</span>
            <span class="violation-count moderate">${summary.violations.moderate}</span>
        </div>
        <div class="violation-item">
            <span class="violation-type">Minor</span>
            <span class="violation-count minor">${summary.violations.minor}</span>
        </div>
    </div>
    
    ${summary.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
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
  
  const reportPath = path.join(process.cwd(), 'accessibility-report', 'index.html');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, htmlTemplate);
}

function getGradeColor(grade) {
  const colors = {
    'A+': '#22c55e',
    'A': '#16a34a',
    'B+': '#65a30d',
    'B': '#84cc16',
    'C+': '#eab308',
    'C': '#f59e0b',
    'D+': '#f97316',
    'D': '#ea580c',
    'F': '#dc2626'
  };
  return colors[grade] || '#6b7280';
}

// Run if called directly
if (require.main === module) {
  generateAccessibilitySummary().catch(console.error);
}

module.exports = { generateAccessibilitySummary };