#!/usr/bin/env node

/**
 * Test Maintenance - Automated test maintenance and optimization
 * Handles test cleanup, optimization, and maintenance tasks
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TestMaintenance {
  constructor(config = {}) {
    this.config = {
      testsDir: config.testsDir || 'tests',
      testResultsDir: config.testResultsDir || 'test-results',
      maxTestDuration: config.maxTestDuration || 30000,
      flakyTestThreshold: config.flakyTestThreshold || 0.1,
      enableAutoFix: config.enableAutoFix || false,
      enableOptimization: config.enableOptimization || true,
      enableCleanup: config.enableCleanup || true,
      retentionDays: config.retentionDays || 30,
      ...config
    };

    this.metrics = {
      totalTests: 0,
      slowTests: [],
      flakyTests: [],
      deprecatedTests: [],
      duplicateTests: [],
      unusedFixtures: [],
      maintenanceActions: []
    };

    this.rules = {
      slowTestThreshold: this.config.maxTestDuration,
      flakyTestThreshold: this.config.flakyTestThreshold,
      duplicateTestThreshold: 0.8,
      unusedFixtureThreshold: 30 // days
    };
  }

  async runMaintenance() {
    console.log('🧹 Starting test maintenance...');
    
    try {
      // Analyze test suite
      await this.analyzeTestSuite();
      
      // Identify issues
      await this.identifyIssues();
      
      // Generate maintenance report
      const report = await this.generateMaintenanceReport();
      
      // Apply fixes if enabled
      if (this.config.enableAutoFix) {
        await this.applyFixes();
      }
      
      // Clean up old test artifacts
      if (this.config.enableCleanup) {
        await this.cleanupArtifacts();
      }
      
      // Optimize test suite
      if (this.config.enableOptimization) {
        await this.optimizeTestSuite();
      }
      
      console.log('✅ Test maintenance completed');
      return report;
      
    } catch (error) {
      console.error('❌ Test maintenance failed:', error);
      throw error;
    }
  }

  async analyzeTestSuite() {
    console.log('📊 Analyzing test suite...');
    
    try {
      // Find all test files
      const testFiles = await glob('**/*.test.{js,ts,jsx,tsx}', { 
        cwd: this.config.testsDir,
        absolute: true 
      });
      
      // Find all spec files
      const specFiles = await glob('**/*.spec.{js,ts,jsx,tsx}', { 
        cwd: this.config.testsDir,
        absolute: true 
      });
      
      const allTestFiles = [...testFiles, ...specFiles];
      this.metrics.totalTests = allTestFiles.length;
      
      // Analyze each test file
      for (const testFile of allTestFiles) {
        await this.analyzeTestFile(testFile);
      }
      
      // Analyze test results
      await this.analyzeTestResults();
      
    } catch (error) {
      console.error('Error analyzing test suite:', error);
    }
  }

  async analyzeTestFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath);
      
      // Check for deprecated patterns
      const deprecatedPatterns = [
        /\.only\(/g,
        /\.skip\(/g,
        /fdescribe\(/g,
        /fit\(/g,
        /xdescribe\(/g,
        /xit\(/g,
        /console\.log\(/g,
        /debugger/g
      ];
      
      for (const pattern of deprecatedPatterns) {
        if (pattern.test(content)) {
          this.metrics.deprecatedTests.push({
            file: filePath,
            pattern: pattern.source,
            type: 'deprecated_pattern'
          });
        }
      }
      
      // Check for duplicate test names
      const testNames = content.match(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g) || [];
      const testNameCounts = {};
      
      for (const testName of testNames) {
        const name = testName.match(/['"`]([^'"`]+)['"`]/)[1];
        testNameCounts[name] = (testNameCounts[name] || 0) + 1;
      }
      
      Object.entries(testNameCounts).forEach(([name, count]) => {
        if (count > 1) {
          this.metrics.duplicateTests.push({
            file: filePath,
            testName: name,
            count: count
          });
        }
      });
      
      // Check for unused imports
      const imports = content.match(/import\s+.*?\s+from\s+['"`][^'"`]+['"`]/g) || [];
      const usedImports = new Set();
      
      for (const importStatement of imports) {
        const importedItems = importStatement.match(/import\s+\{([^}]+)\}/);
        if (importedItems) {
          const items = importedItems[1].split(',').map(item => item.trim());
          for (const item of items) {
            if (!content.includes(item)) {
              this.metrics.unusedFixtures.push({
                file: filePath,
                import: item,
                type: 'unused_import'
              });
            }
          }
        }
      }
      
    } catch (error) {
      console.error(`Error analyzing test file ${filePath}:`, error);
    }
  }

  async analyzeTestResults() {
    try {
      // Find test result files
      const resultFiles = await glob('**/*.json', { 
        cwd: this.config.testResultsDir,
        absolute: true 
      });
      
      const testHistory = {};
      
      for (const resultFile of resultFiles) {
        try {
          const content = fs.readFileSync(resultFile, 'utf8');
          const data = JSON.parse(content);
          
          if (data.tests) {
            for (const test of data.tests) {
              const testKey = `${test.file}:${test.title}`;
              
              if (!testHistory[testKey]) {
                testHistory[testKey] = {
                  runs: [],
                  file: test.file,
                  title: test.title
                };
              }
              
              testHistory[testKey].runs.push({
                duration: test.duration,
                outcome: test.outcome,
                timestamp: test.timestamp
              });
            }
          }
        } catch (error) {
          console.error(`Error processing result file ${resultFile}:`, error);
        }
      }
      
      // Analyze test history for patterns
      Object.values(testHistory).forEach(testData => {
        const runs = testData.runs;
        if (runs.length === 0) return;
        
        // Check for slow tests
        const avgDuration = runs.reduce((sum, run) => sum + run.duration, 0) / runs.length;
        if (avgDuration > this.rules.slowTestThreshold) {
          this.metrics.slowTests.push({
            file: testData.file,
            title: testData.title,
            avgDuration: avgDuration,
            runs: runs.length
          });
        }
        
        // Check for flaky tests
        const passCount = runs.filter(run => run.outcome === 'passed').length;
        const failureRate = (runs.length - passCount) / runs.length;
        
        if (failureRate > 0 && failureRate < this.rules.flakyTestThreshold) {
          this.metrics.flakyTests.push({
            file: testData.file,
            title: testData.title,
            failureRate: failureRate,
            runs: runs.length,
            recentRuns: runs.slice(-10)
          });
        }
      });
      
    } catch (error) {
      console.error('Error analyzing test results:', error);
    }
  }

  async identifyIssues() {
    console.log('🔍 Identifying test issues...');
    
    const issues = [];
    
    // Slow tests
    if (this.metrics.slowTests.length > 0) {
      issues.push({
        type: 'slow_tests',
        count: this.metrics.slowTests.length,
        severity: 'medium',
        description: `${this.metrics.slowTests.length} tests are running slower than ${this.rules.slowTestThreshold}ms`,
        items: this.metrics.slowTests
      });
    }
    
    // Flaky tests
    if (this.metrics.flakyTests.length > 0) {
      issues.push({
        type: 'flaky_tests',
        count: this.metrics.flakyTests.length,
        severity: 'high',
        description: `${this.metrics.flakyTests.length} tests are flaky`,
        items: this.metrics.flakyTests
      });
    }
    
    // Deprecated patterns
    if (this.metrics.deprecatedTests.length > 0) {
      issues.push({
        type: 'deprecated_patterns',
        count: this.metrics.deprecatedTests.length,
        severity: 'medium',
        description: `${this.metrics.deprecatedTests.length} tests contain deprecated patterns`,
        items: this.metrics.deprecatedTests
      });
    }
    
    // Duplicate tests
    if (this.metrics.duplicateTests.length > 0) {
      issues.push({
        type: 'duplicate_tests',
        count: this.metrics.duplicateTests.length,
        severity: 'low',
        description: `${this.metrics.duplicateTests.length} duplicate test names found`,
        items: this.metrics.duplicateTests
      });
    }
    
    // Unused fixtures
    if (this.metrics.unusedFixtures.length > 0) {
      issues.push({
        type: 'unused_fixtures',
        count: this.metrics.unusedFixtures.length,
        severity: 'low',
        description: `${this.metrics.unusedFixtures.length} unused imports found`,
        items: this.metrics.unusedFixtures
      });
    }
    
    this.metrics.issues = issues;
    return issues;
  }

  async applyFixes() {
    console.log('🔧 Applying automated fixes...');
    
    for (const issue of this.metrics.issues) {
      try {
        switch (issue.type) {
          case 'deprecated_patterns':
            await this.fixDeprecatedPatterns(issue.items);
            break;
            
          case 'unused_fixtures':
            await this.fixUnusedFixtures(issue.items);
            break;
            
          case 'duplicate_tests':
            await this.fixDuplicateTests(issue.items);
            break;
            
          default:
            console.log(`No automated fix available for ${issue.type}`);
        }
      } catch (error) {
        console.error(`Error applying fix for ${issue.type}:`, error);
      }
    }
  }

  async fixDeprecatedPatterns(items) {
    const fixedFiles = new Set();
    
    for (const item of items) {
      if (fixedFiles.has(item.file)) continue;
      
      try {
        let content = fs.readFileSync(item.file, 'utf8');
        
        // Remove .only and .skip
        content = content.replace(/\.(only|skip)\(/g, '(');
        
        // Remove fdescribe, fit, xdescribe, xit
        content = content.replace(/f(describe|it)\(/g, '$1(');
        content = content.replace(/x(describe|it)\(/g, '$1.skip(');
        
        // Remove console.log statements
        content = content.replace(/console\.log\([^)]*\);?\n?/g, '');
        
        // Remove debugger statements
        content = content.replace(/debugger;?\n?/g, '');
        
        fs.writeFileSync(item.file, content);
        fixedFiles.add(item.file);
        
        this.metrics.maintenanceActions.push({
          type: 'fix_deprecated_patterns',
          file: item.file,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`Error fixing deprecated patterns in ${item.file}:`, error);
      }
    }
  }

  async fixUnusedFixtures(items) {
    const fixedFiles = new Set();
    
    for (const item of items) {
      if (fixedFiles.has(item.file)) continue;
      
      try {
        let content = fs.readFileSync(item.file, 'utf8');
        
        // Remove unused imports
        const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${item.import}\\b[^}]*\\}\\s+from\\s+['"][^'"]+['"];?`, 'g');
        content = content.replace(importRegex, (match) => {
          // Remove only the specific import
          return match.replace(new RegExp(`\\b${item.import}\\b,?\\s*`), '');
        });
        
        // Clean up empty import statements
        content = content.replace(/import\s+\{\s*\}\s+from\s+['"][^'"]+['"];?\n?/g, '');
        
        fs.writeFileSync(item.file, content);
        fixedFiles.add(item.file);
        
        this.metrics.maintenanceActions.push({
          type: 'fix_unused_fixtures',
          file: item.file,
          import: item.import,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`Error fixing unused fixtures in ${item.file}:`, error);
      }
    }
  }

  async fixDuplicateTests(items) {
    const fixedFiles = new Set();
    
    for (const item of items) {
      if (fixedFiles.has(item.file)) continue;
      
      try {
        let content = fs.readFileSync(item.file, 'utf8');
        
        // Add suffix to duplicate test names
        let counter = 1;
        content = content.replace(
          new RegExp(`((?:it|test)\\s*\\(\\s*['"\`]${item.testName}['"\`])`, 'g'),
          (match, p1) => {
            if (counter === 1) {
              counter++;
              return match;
            } else {
              return match.replace(item.testName, `${item.testName} (${counter++})`);
            }
          }
        );
        
        fs.writeFileSync(item.file, content);
        fixedFiles.add(item.file);
        
        this.metrics.maintenanceActions.push({
          type: 'fix_duplicate_tests',
          file: item.file,
          testName: item.testName,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error(`Error fixing duplicate tests in ${item.file}:`, error);
      }
    }
  }

  async optimizeTestSuite() {
    console.log('⚡ Optimizing test suite...');
    
    try {
      // Optimize test parallelization
      await this.optimizeParallelization();
      
      // Optimize test data management
      await this.optimizeTestData();
      
      // Optimize test fixtures
      await this.optimizeFixtures();
      
    } catch (error) {
      console.error('Error optimizing test suite:', error);
    }
  }

  async optimizeParallelization() {
    // Analyze test execution times and suggest optimal sharding
    const testDurations = this.metrics.slowTests.map(test => ({
      file: test.file,
      duration: test.avgDuration
    }));
    
    // Sort by duration (descending)
    testDurations.sort((a, b) => b.duration - a.duration);
    
    // Suggest optimal shard distribution
    const shardCount = 4;
    const shards = Array.from({ length: shardCount }, () => ({ files: [], totalDuration: 0 }));
    
    for (const test of testDurations) {
      // Find shard with minimum total duration
      const minShard = shards.reduce((min, shard, index) => 
        shard.totalDuration < min.totalDuration ? { ...shard, index } : min
      );
      
      shards[minShard.index].files.push(test.file);
      shards[minShard.index].totalDuration += test.duration;
    }
    
    // Generate shard configuration
    const shardConfig = {
      shardCount,
      estimatedTotalDuration: Math.max(...shards.map(s => s.totalDuration)),
      shards: shards.map((shard, index) => ({
        index,
        files: shard.files,
        estimatedDuration: shard.totalDuration
      }))
    };
    
    // Write shard configuration
    fs.writeFileSync(
      path.join(this.config.testsDir, 'shard-config.json'),
      JSON.stringify(shardConfig, null, 2)
    );
    
    this.metrics.maintenanceActions.push({
      type: 'optimize_parallelization',
      shardCount,
      timestamp: new Date().toISOString()
    });
  }

  async optimizeTestData() {
    // Clean up test data and optimize fixtures
    const testDataDir = path.join(this.config.testsDir, 'fixtures');
    
    if (fs.existsSync(testDataDir)) {
      const files = fs.readdirSync(testDataDir);
      
      for (const file of files) {
        const filePath = path.join(testDataDir, file);
        const stats = fs.statSync(filePath);
        
        // Remove old test data files
        const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld > this.rules.unusedFixtureThreshold) {
          fs.unlinkSync(filePath);
          
          this.metrics.maintenanceActions.push({
            type: 'cleanup_old_fixtures',
            file: filePath,
            daysOld: Math.floor(daysOld),
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }

  async optimizeFixtures() {
    // Analyze and optimize test fixtures
    const fixtureFiles = await glob('**/fixtures/**/*.{js,ts,json}', { 
      cwd: this.config.testsDir,
      absolute: true 
    });
    
    for (const fixtureFile of fixtureFiles) {
      try {
        const content = fs.readFileSync(fixtureFile, 'utf8');
        
        if (fixtureFile.endsWith('.json')) {
          // Optimize JSON fixtures
          const data = JSON.parse(content);
          const optimized = JSON.stringify(data, null, 2);
          
          if (optimized !== content) {
            fs.writeFileSync(fixtureFile, optimized);
            
            this.metrics.maintenanceActions.push({
              type: 'optimize_fixture',
              file: fixtureFile,
              timestamp: new Date().toISOString()
            });
          }
        }
      } catch (error) {
        console.error(`Error optimizing fixture ${fixtureFile}:`, error);
      }
    }
  }

  async cleanupArtifacts() {
    console.log('🧹 Cleaning up test artifacts...');
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      // Clean up test results
      const resultFiles = await glob('**/*', { 
        cwd: this.config.testResultsDir,
        absolute: true 
      });
      
      for (const file of resultFiles) {
        try {
          const stats = fs.statSync(file);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(file);
            
            this.metrics.maintenanceActions.push({
              type: 'cleanup_artifact',
              file: file,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          // File might have already been deleted
        }
      }
      
      // Clean up screenshots
      const screenshotFiles = await glob('**/*.png', { 
        cwd: this.config.testsDir,
        absolute: true 
      });
      
      for (const file of screenshotFiles) {
        try {
          const stats = fs.statSync(file);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(file);
            
            this.metrics.maintenanceActions.push({
              type: 'cleanup_screenshot',
              file: file,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          // File might have already been deleted
        }
      }
      
    } catch (error) {
      console.error('Error cleaning up artifacts:', error);
    }
  }

  async generateMaintenanceReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.metrics.totalTests,
        issuesFound: this.metrics.issues.length,
        actionsPerformed: this.metrics.maintenanceActions.length,
        slowTests: this.metrics.slowTests.length,
        flakyTests: this.metrics.flakyTests.length,
        deprecatedPatterns: this.metrics.deprecatedTests.length,
        duplicateTests: this.metrics.duplicateTests.length,
        unusedFixtures: this.metrics.unusedFixtures.length
      },
      issues: this.metrics.issues,
      maintenanceActions: this.metrics.maintenanceActions,
      recommendations: this.generateRecommendations(),
      nextMaintenanceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'test-maintenance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 Test maintenance report generated:', reportPath);
    return report;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.slowTests.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        message: `Consider optimizing ${this.metrics.slowTests.length} slow tests`,
        actions: [
          'Review test setup and teardown',
          'Optimize database queries in tests',
          'Consider using test doubles for external dependencies',
          'Implement proper test parallelization'
        ]
      });
    }
    
    if (this.metrics.flakyTests.length > 0) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        message: `Fix ${this.metrics.flakyTests.length} flaky tests to improve reliability`,
        actions: [
          'Review test assertions for timing issues',
          'Add proper wait conditions',
          'Stabilize test data and state management',
          'Consider test isolation improvements'
        ]
      });
    }
    
    if (this.metrics.deprecatedTests.length > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'medium',
        message: `Clean up ${this.metrics.deprecatedTests.length} deprecated test patterns`,
        actions: [
          'Remove .only and .skip from committed tests',
          'Remove console.log statements',
          'Remove debugger statements',
          'Update to modern test patterns'
        ]
      });
    }
    
    return recommendations;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const maintenance = new TestMaintenance({
    testsDir: process.cwd(),
    enableAutoFix: process.env.AUTO_FIX === 'true',
    enableOptimization: process.env.OPTIMIZE === 'true',
    enableCleanup: process.env.CLEANUP === 'true'
  });
  
  (async () => {
    try {
      switch (command) {
        case 'analyze':
          await maintenance.analyzeTestSuite();
          await maintenance.identifyIssues();
          await maintenance.generateMaintenanceReport();
          break;
          
        case 'fix':
          await maintenance.runMaintenance();
          break;
          
        case 'cleanup':
          await maintenance.cleanupArtifacts();
          break;
          
        case 'optimize':
          await maintenance.optimizeTestSuite();
          break;
          
        default:
          console.log('Usage: node test-maintenance.js [analyze|fix|cleanup|optimize]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Test maintenance error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { TestMaintenance };