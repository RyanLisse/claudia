#!/usr/bin/env node

/**
 * Test Reporter - Centralized test reporting and monitoring
 * Handles real-time test monitoring, Slack notifications, and dashboard updates
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TestReporter {
  constructor(config = {}) {
    this.config = {
      slackWebhook: config.slackWebhook || process.env.SLACK_WEBHOOK_URL,
      dashboardUrl: config.dashboardUrl || process.env.DASHBOARD_URL,
      enableSlack: config.enableSlack || false,
      enableDashboard: config.enableDashboard || false,
      enableEmail: config.enableEmail || false,
      emailRecipients: config.emailRecipients || [],
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.metrics = {
      startTime: null,
      endTime: null,
      duration: 0,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      flakyTests: 0,
      errors: [],
      warnings: [],
      performance: {
        slowTests: [],
        avgTestTime: 0,
        maxTestTime: 0,
        minTestTime: Infinity
      }
    };

    this.thresholds = {
      slowTestMs: 30000,
      errorRate: 0.05,
      flakyRate: 0.02,
      performanceScore: 0.8
    };
  }

  async startMonitoring() {
    console.log('🔍 Starting test monitoring...');
    this.metrics.startTime = Date.now();
    
    // Initialize monitoring dashboard
    if (this.config.enableDashboard) {
      await this.initializeDashboard();
    }
    
    // Send start notification
    await this.sendNotification('start', {
      message: 'E2E Test Suite Started',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test'
    });
  }

  async stopMonitoring() {
    console.log('📊 Stopping test monitoring...');
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    
    // Generate final report
    const report = await this.generateReport();
    
    // Send completion notification
    await this.sendNotification('complete', report);
    
    // Update dashboard
    if (this.config.enableDashboard) {
      await this.updateDashboard(report);
    }
    
    return report;
  }

  async processTestResults(resultsDir) {
    console.log('📋 Processing test results...');
    
    try {
      // Find all test result files
      const junitFiles = await glob('**/junit-*.xml', { cwd: resultsDir });
      const jsonFiles = await glob('**/test-results-*.json', { cwd: resultsDir });
      const playwrightReports = await glob('**/playwright-report-*/report.json', { cwd: resultsDir });
      
      // Process JUnit XML results
      for (const file of junitFiles) {
        await this.processJUnitFile(path.join(resultsDir, file));
      }
      
      // Process JSON results
      for (const file of jsonFiles) {
        await this.processJsonFile(path.join(resultsDir, file));
      }
      
      // Process Playwright reports
      for (const file of playwrightReports) {
        await this.processPlaywrightReport(path.join(resultsDir, file));
      }
      
      // Calculate derived metrics
      this.calculateMetrics();
      
    } catch (error) {
      console.error('Error processing test results:', error);
      this.metrics.errors.push({
        type: 'processing_error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async processJUnitFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const xml2js = require('xml2js');
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(content);
      
      const testsuite = result.testsuites?.testsuite?.[0] || result.testsuite;
      if (!testsuite) return;
      
      const tests = parseInt(testsuite.$.tests) || 0;
      const failures = parseInt(testsuite.$.failures) || 0;
      const errors = parseInt(testsuite.$.errors) || 0;
      const skipped = parseInt(testsuite.$.skipped) || 0;
      
      this.metrics.totalTests += tests;
      this.metrics.failedTests += failures + errors;
      this.metrics.skippedTests += skipped;
      this.metrics.passedTests += tests - failures - errors - skipped;
      
      // Process individual test cases
      const testcases = testsuite.testcase || [];
      for (const testcase of testcases) {
        const duration = parseFloat(testcase.$.time) * 1000; // Convert to ms
        this.updatePerformanceMetrics(testcase.$.name, duration);
        
        // Check for flaky tests (multiple runs with different outcomes)
        if (testcase.flakyFailure) {
          this.metrics.flakyTests++;
        }
      }
      
    } catch (error) {
      console.error(`Error processing JUnit file ${filePath}:`, error);
    }
  }

  async processJsonFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.stats) {
        this.metrics.totalTests += data.stats.tests || 0;
        this.metrics.passedTests += data.stats.passes || 0;
        this.metrics.failedTests += data.stats.failures || 0;
        this.metrics.skippedTests += data.stats.pending || 0;
      }
      
      if (data.tests) {
        for (const test of data.tests) {
          this.updatePerformanceMetrics(test.title, test.duration);
          
          if (test.err) {
            this.metrics.errors.push({
              type: 'test_error',
              test: test.title,
              message: test.err.message,
              stack: test.err.stack,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
      
    } catch (error) {
      console.error(`Error processing JSON file ${filePath}:`, error);
    }
  }

  async processPlaywrightReport(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      
      if (data.stats) {
        this.metrics.totalTests += data.stats.total || 0;
        this.metrics.passedTests += data.stats.passed || 0;
        this.metrics.failedTests += data.stats.failed || 0;
        this.metrics.skippedTests += data.stats.skipped || 0;
        this.metrics.flakyTests += data.stats.flaky || 0;
      }
      
      if (data.suites) {
        for (const suite of data.suites) {
          await this.processSuite(suite);
        }
      }
      
    } catch (error) {
      console.error(`Error processing Playwright report ${filePath}:`, error);
    }
  }

  async processSuite(suite) {
    if (suite.specs) {
      for (const spec of suite.specs) {
        for (const test of spec.tests) {
          const duration = test.results?.[0]?.duration || 0;
          this.updatePerformanceMetrics(test.title, duration);
          
          if (test.outcome === 'flaky') {
            this.metrics.flakyTests++;
          }
          
          if (test.results?.[0]?.error) {
            this.metrics.errors.push({
              type: 'playwright_error',
              test: test.title,
              message: test.results[0].error.message,
              location: test.results[0].error.location,
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    }
    
    if (suite.suites) {
      for (const subSuite of suite.suites) {
        await this.processSuite(subSuite);
      }
    }
  }

  updatePerformanceMetrics(testName, duration) {
    this.metrics.performance.avgTestTime = (
      (this.metrics.performance.avgTestTime * (this.metrics.totalTests - 1) + duration) / 
      this.metrics.totalTests
    );
    
    this.metrics.performance.maxTestTime = Math.max(
      this.metrics.performance.maxTestTime, 
      duration
    );
    
    this.metrics.performance.minTestTime = Math.min(
      this.metrics.performance.minTestTime, 
      duration
    );
    
    if (duration > this.thresholds.slowTestMs) {
      this.metrics.performance.slowTests.push({
        name: testName,
        duration: duration,
        threshold: this.thresholds.slowTestMs
      });
    }
  }

  calculateMetrics() {
    // Calculate error rate
    const errorRate = this.metrics.totalTests > 0 ? 
      this.metrics.failedTests / this.metrics.totalTests : 0;
    
    // Calculate flaky rate
    const flakyRate = this.metrics.totalTests > 0 ? 
      this.metrics.flakyTests / this.metrics.totalTests : 0;
    
    // Calculate performance score
    const performanceScore = this.calculatePerformanceScore();
    
    // Add warnings for threshold violations
    if (errorRate > this.thresholds.errorRate) {
      this.metrics.warnings.push({
        type: 'high_error_rate',
        message: `Error rate ${(errorRate * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.errorRate * 100).toFixed(2)}%`,
        value: errorRate,
        threshold: this.thresholds.errorRate
      });
    }
    
    if (flakyRate > this.thresholds.flakyRate) {
      this.metrics.warnings.push({
        type: 'high_flaky_rate',
        message: `Flaky test rate ${(flakyRate * 100).toFixed(2)}% exceeds threshold ${(this.thresholds.flakyRate * 100).toFixed(2)}%`,
        value: flakyRate,
        threshold: this.thresholds.flakyRate
      });
    }
    
    if (performanceScore < this.thresholds.performanceScore) {
      this.metrics.warnings.push({
        type: 'low_performance_score',
        message: `Performance score ${(performanceScore * 100).toFixed(2)}% below threshold ${(this.thresholds.performanceScore * 100).toFixed(2)}%`,
        value: performanceScore,
        threshold: this.thresholds.performanceScore
      });
    }
    
    // Add calculated metrics
    this.metrics.errorRate = errorRate;
    this.metrics.flakyRate = flakyRate;
    this.metrics.performanceScore = performanceScore;
    this.metrics.successRate = this.metrics.totalTests > 0 ? 
      this.metrics.passedTests / this.metrics.totalTests : 0;
  }

  calculatePerformanceScore() {
    if (this.metrics.totalTests === 0) return 1.0;
    
    // Factor in slow tests
    const slowTestPenalty = this.metrics.performance.slowTests.length / this.metrics.totalTests;
    
    // Factor in average test time
    const avgTimePenalty = Math.min(
      this.metrics.performance.avgTestTime / this.thresholds.slowTestMs, 
      1.0
    );
    
    // Calculate composite score
    const score = 1.0 - (slowTestPenalty * 0.6 + avgTimePenalty * 0.4);
    
    return Math.max(0, Math.min(1, score));
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.metrics.duration,
      summary: {
        total: this.metrics.totalTests,
        passed: this.metrics.passedTests,
        failed: this.metrics.failedTests,
        skipped: this.metrics.skippedTests,
        flaky: this.metrics.flakyTests,
        successRate: this.metrics.successRate,
        errorRate: this.metrics.errorRate,
        flakyRate: this.metrics.flakyRate
      },
      performance: {
        score: this.metrics.performanceScore,
        avgTestTime: this.metrics.performance.avgTestTime,
        maxTestTime: this.metrics.performance.maxTestTime,
        minTestTime: this.metrics.performance.minTestTime,
        slowTests: this.metrics.performance.slowTests
      },
      issues: {
        errors: this.metrics.errors,
        warnings: this.metrics.warnings
      },
      status: this.getOverallStatus(),
      grade: this.getGrade()
    };
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'test-monitoring-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Test monitoring report generated:', reportPath);
    return report;
  }

  getOverallStatus() {
    if (this.metrics.failedTests > 0) return 'failed';
    if (this.metrics.warnings.length > 0) return 'warning';
    return 'passed';
  }

  getGrade() {
    const score = (this.metrics.successRate * 0.4 + 
                  this.metrics.performanceScore * 0.3 + 
                  (1 - this.metrics.errorRate) * 0.2 + 
                  (1 - this.metrics.flakyRate) * 0.1);
    
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

  async sendNotification(type, data) {
    const notifications = [];
    
    if (this.config.enableSlack && this.config.slackWebhook) {
      notifications.push(this.sendSlackNotification(type, data));
    }
    
    if (this.config.enableEmail && this.config.emailRecipients.length > 0) {
      notifications.push(this.sendEmailNotification(type, data));
    }
    
    try {
      await Promise.all(notifications);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  }

  async sendSlackNotification(type, data) {
    const webhook = this.config.slackWebhook;
    if (!webhook) return;
    
    let message;
    let color;
    
    switch (type) {
      case 'start':
        message = {
          text: '🚀 E2E Test Suite Started',
          attachments: [{
            color: '#36a64f',
            fields: [
              { title: 'Environment', value: data.environment, short: true },
              { title: 'Started At', value: data.timestamp, short: true }
            ]
          }]
        };
        break;
        
      case 'complete':
        color = data.status === 'passed' ? '#36a64f' : 
                data.status === 'warning' ? '#ff9500' : '#ff4757';
        
        message = {
          text: `${data.status === 'passed' ? '✅' : data.status === 'warning' ? '⚠️' : '❌'} E2E Test Suite Complete`,
          attachments: [{
            color: color,
            fields: [
              { title: 'Status', value: data.status.toUpperCase(), short: true },
              { title: 'Grade', value: data.grade, short: true },
              { title: 'Total Tests', value: data.summary.total.toString(), short: true },
              { title: 'Success Rate', value: `${(data.summary.successRate * 100).toFixed(1)}%`, short: true },
              { title: 'Duration', value: `${Math.round(data.duration / 1000)}s`, short: true },
              { title: 'Performance Score', value: `${(data.performance.score * 100).toFixed(1)}%`, short: true }
            ]
          }]
        };
        break;
        
      default:
        return;
    }
    
    try {
      const response = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`Slack notification failed: ${response.statusText}`);
      }
      
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  async sendEmailNotification(type, data) {
    // Email notification implementation would go here
    // This is a placeholder for email service integration
    console.log(`📧 Email notification (${type}) would be sent to:`, this.config.emailRecipients);
  }

  async initializeDashboard() {
    // Dashboard initialization would go here
    console.log('📊 Dashboard monitoring initialized');
  }

  async updateDashboard(report) {
    // Dashboard update implementation would go here
    console.log('📊 Dashboard updated with test results');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const reporter = new TestReporter({
    enableSlack: process.env.ENABLE_SLACK_NOTIFICATIONS === 'true',
    enableDashboard: process.env.ENABLE_DASHBOARD === 'true',
    enableEmail: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true'
  });
  
  (async () => {
    try {
      switch (command) {
        case 'start':
          await reporter.startMonitoring();
          break;
          
        case 'stop':
          await reporter.stopMonitoring();
          break;
          
        case 'process':
          const resultsDir = args[1] || 'test-results';
          await reporter.processTestResults(resultsDir);
          const report = await reporter.generateReport();
          console.log('Final Report:', JSON.stringify(report, null, 2));
          break;
          
        default:
          console.log('Usage: node test-reporter.js [start|stop|process] [results-dir]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Test reporter error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { TestReporter };