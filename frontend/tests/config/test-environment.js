#!/usr/bin/env node

/**
 * Test Environment Configuration
 * Manages test environment setup, configuration, and teardown
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class TestEnvironment {
  constructor(config = {}) {
    this.config = {
      // Environment settings
      nodeEnv: config.nodeEnv || 'test',
      port: config.port || 3000,
      apiUrl: config.apiUrl || 'http://localhost:3000',
      wsUrl: config.wsUrl || 'ws://localhost:3000',
      
      // Database settings
      dbUrl: config.dbUrl || 'postgresql://test:test@localhost:5432/test_db',
      dbMigrations: config.dbMigrations || true,
      dbSeed: config.dbSeed || true,
      
      // Test settings
      headless: config.headless !== false,
      slowMo: config.slowMo || 0,
      video: config.video || 'retain-on-failure',
      screenshot: config.screenshot || 'only-on-failure',
      trace: config.trace || 'retain-on-failure',
      
      // Browser settings
      browsers: config.browsers || ['chromium', 'firefox', 'webkit'],
      workers: config.workers || 4,
      timeout: config.timeout || 30000,
      
      // CI/CD settings
      ciMode: config.ciMode || process.env.CI === 'true',
      retries: config.retries || (process.env.CI ? 2 : 0),
      
      // Feature flags
      enableVisualTesting: config.enableVisualTesting !== false,
      enableAccessibilityTesting: config.enableAccessibilityTesting !== false,
      enablePerformanceTesting: config.enablePerformanceTesting !== false,
      enableStagehand: config.enableStagehand !== false,
      
      // External services
      services: config.services || {
        redis: false,
        elasticsearch: false,
        s3: false
      },
      
      ...config
    };

    this.processes = new Map();
    this.teardownHandlers = [];
    this.isSetup = false;
  }

  async setup() {
    if (this.isSetup) {
      console.log('⚠️  Test environment already set up');
      return;
    }

    console.log('🚀 Setting up test environment...');
    
    try {
      // Create test directories
      await this.createTestDirectories();
      
      // Setup environment variables
      await this.setupEnvironmentVariables();
      
      // Initialize database
      if (this.config.dbMigrations) {
        await this.setupDatabase();
      }
      
      // Start external services
      await this.startExternalServices();
      
      // Setup test data
      if (this.config.dbSeed) {
        await this.seedTestData();
      }
      
      // Start application server
      await this.startApplicationServer();
      
      // Verify environment
      await this.verifyEnvironment();
      
      this.isSetup = true;
      console.log('✅ Test environment setup complete');
      
    } catch (error) {
      console.error('❌ Failed to setup test environment:', error);
      await this.teardown();
      throw error;
    }
  }

  async teardown() {
    if (!this.isSetup) {
      console.log('⚠️  Test environment not set up');
      return;
    }

    console.log('🧹 Tearing down test environment...');
    
    try {
      // Run teardown handlers in reverse order
      for (const handler of this.teardownHandlers.reverse()) {
        try {
          await handler();
        } catch (error) {
          console.error('Error in teardown handler:', error);
        }
      }
      
      // Stop all processes
      for (const [name, process] of this.processes) {
        try {
          console.log(`Stopping ${name}...`);
          process.kill('SIGTERM');
          
          // Wait for graceful shutdown
          await new Promise((resolve) => {
            setTimeout(resolve, 2000);
          });
          
          // Force kill if still running
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        } catch (error) {
          console.error(`Error stopping ${name}:`, error);
        }
      }
      
      // Clean up test data
      await this.cleanupTestData();
      
      // Clean up temporary files
      await this.cleanupTempFiles();
      
      this.processes.clear();
      this.teardownHandlers.length = 0;
      this.isSetup = false;
      
      console.log('✅ Test environment teardown complete');
      
    } catch (error) {
      console.error('❌ Error during teardown:', error);
    }
  }

  async createTestDirectories() {
    const dirs = [
      'test-results',
      'test-results/videos',
      'test-results/screenshots',
      'test-results/traces',
      'test-results/downloads',
      'test-results/accessibility',
      'test-results/performance',
      'test-results/visual-regression',
      'test-data',
      'test-data/fixtures',
      'test-data/uploads',
      'test-data/exports',
      'playwright-report',
      'coverage'
    ];

    for (const dir of dirs) {
      const fullPath = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
  }

  async setupEnvironmentVariables() {
    const envVars = {
      NODE_ENV: this.config.nodeEnv,
      PORT: this.config.port.toString(),
      NEXT_PUBLIC_API_URL: this.config.apiUrl,
      NEXT_PUBLIC_WS_URL: this.config.wsUrl,
      DATABASE_URL: this.config.dbUrl,
      
      // Test-specific variables
      PLAYWRIGHT_HEADLESS: this.config.headless.toString(),
      PLAYWRIGHT_SLOW_MO: this.config.slowMo.toString(),
      PLAYWRIGHT_VIDEO: this.config.video,
      PLAYWRIGHT_SCREENSHOT: this.config.screenshot,
      PLAYWRIGHT_TRACE: this.config.trace,
      
      // Feature flags
      ENABLE_VISUAL_TESTING: this.config.enableVisualTesting.toString(),
      ENABLE_ACCESSIBILITY_TESTING: this.config.enableAccessibilityTesting.toString(),
      ENABLE_PERFORMANCE_TESTING: this.config.enablePerformanceTesting.toString(),
      ENABLE_STAGEHAND: this.config.enableStagehand.toString(),
      
      // CI/CD variables
      CI: this.config.ciMode.toString(),
      PLAYWRIGHT_WORKERS: this.config.workers.toString(),
      PLAYWRIGHT_TIMEOUT: this.config.timeout.toString(),
      PLAYWRIGHT_RETRIES: this.config.retries.toString(),
      
      // Security
      JWT_SECRET: 'test-jwt-secret-key',
      ENCRYPTION_KEY: 'test-encryption-key-32-characters',
      
      // External services
      REDIS_URL: this.config.services.redis ? 'redis://localhost:6379' : '',
      ELASTICSEARCH_URL: this.config.services.elasticsearch ? 'http://localhost:9200' : '',
      S3_ENDPOINT: this.config.services.s3 ? 'http://localhost:9000' : ''
    };

    // Write .env.test file
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(path.join(process.cwd(), '.env.test'), envContent);
    
    // Set environment variables for current process
    Object.assign(process.env, envVars);
  }

  async setupDatabase() {
    console.log('🗄️  Setting up test database...');
    
    try {
      // Check if database exists
      const dbExists = await this.checkDatabaseExists();
      
      if (!dbExists) {
        await this.createTestDatabase();
      }
      
      // Run migrations
      await this.runMigrations();
      
      console.log('✅ Database setup complete');
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  async checkDatabaseExists() {
    try {
      await execAsync('psql -c "SELECT 1" ' + this.config.dbUrl);
      return true;
    } catch (error) {
      return false;
    }
  }

  async createTestDatabase() {
    const dbName = 'test_db';
    const baseUrl = this.config.dbUrl.replace(`/${dbName}`, '/postgres');
    
    await execAsync(`psql -c "CREATE DATABASE ${dbName}" ${baseUrl}`);
    console.log(`Created test database: ${dbName}`);
  }

  async runMigrations() {
    try {
      // Check if migrations directory exists
      const migrationsDir = path.join(process.cwd(), 'migrations');
      if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found, skipping migrations');
        return;
      }

      // Run database migrations
      await execAsync('npm run db:migrate');
      console.log('✅ Database migrations complete');
      
    } catch (error) {
      console.error('❌ Database migrations failed:', error);
      throw error;
    }
  }

  async startExternalServices() {
    const services = this.config.services;
    
    // Start Redis if enabled
    if (services.redis) {
      await this.startRedis();
    }
    
    // Start Elasticsearch if enabled
    if (services.elasticsearch) {
      await this.startElasticsearch();
    }
    
    // Start S3 (MinIO) if enabled
    if (services.s3) {
      await this.startS3();
    }
  }

  async startRedis() {
    console.log('Starting Redis...');
    
    const redisProcess = spawn('redis-server', ['--port', '6379'], {
      stdio: 'pipe',
      detached: false
    });
    
    this.processes.set('redis', redisProcess);
    
    // Wait for Redis to be ready
    await this.waitForService('redis://localhost:6379', 'Redis');
    
    this.teardownHandlers.push(() => {
      redisProcess.kill();
    });
  }

  async startElasticsearch() {
    console.log('Starting Elasticsearch...');
    
    const esProcess = spawn('elasticsearch', [], {
      stdio: 'pipe',
      detached: false,
      env: {
        ...process.env,
        'discovery.type': 'single-node',
        'xpack.security.enabled': 'false'
      }
    });
    
    this.processes.set('elasticsearch', esProcess);
    
    // Wait for Elasticsearch to be ready
    await this.waitForService('http://localhost:9200', 'Elasticsearch');
    
    this.teardownHandlers.push(() => {
      esProcess.kill();
    });
  }

  async startS3() {
    console.log('Starting MinIO (S3)...');
    
    const s3Process = spawn('minio', ['server', './test-data/s3'], {
      stdio: 'pipe',
      detached: false,
      env: {
        ...process.env,
        MINIO_ROOT_USER: 'testuser',
        MINIO_ROOT_PASSWORD: 'testpassword'
      }
    });
    
    this.processes.set('s3', s3Process);
    
    // Wait for MinIO to be ready
    await this.waitForService('http://localhost:9000', 'MinIO');
    
    this.teardownHandlers.push(() => {
      s3Process.kill();
    });
  }

  async seedTestData() {
    console.log('🌱 Seeding test data...');
    
    try {
      // Check if seed script exists
      const seedScript = path.join(process.cwd(), 'scripts', 'seed-test-data.js');
      if (fs.existsSync(seedScript)) {
        await execAsync(`node ${seedScript}`);
      } else {
        // Create basic test data
        await this.createBasicTestData();
      }
      
      console.log('✅ Test data seeded');
      
    } catch (error) {
      console.error('❌ Failed to seed test data:', error);
      throw error;
    }
  }

  async createBasicTestData() {
    // Create test fixtures
    const fixtures = {
      users: [
        {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      projects: [
        {
          id: 1,
          name: 'Test Project',
          description: 'A test project for E2E testing',
          userId: 1,
          createdAt: new Date().toISOString()
        }
      ],
      agents: [
        {
          id: 1,
          name: 'Test Agent',
          type: 'coder',
          status: 'active',
          projectId: 1,
          createdAt: new Date().toISOString()
        }
      ]
    };

    // Write fixtures to files
    for (const [name, data] of Object.entries(fixtures)) {
      const filePath = path.join(process.cwd(), 'test-data', 'fixtures', `${name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
  }

  async startApplicationServer() {
    console.log('🚀 Starting application server...');
    
    try {
      // Build the application first
      await execAsync('npm run build');
      
      // Start the server
      const serverProcess = spawn('npm', ['run', 'start'], {
        stdio: 'pipe',
        detached: false,
        env: {
          ...process.env,
          PORT: this.config.port.toString()
        }
      });
      
      this.processes.set('server', serverProcess);
      
      // Wait for server to be ready
      await this.waitForService(this.config.apiUrl, 'Application Server');
      
      this.teardownHandlers.push(() => {
        serverProcess.kill();
      });
      
      console.log('✅ Application server started');
      
    } catch (error) {
      console.error('❌ Failed to start application server:', error);
      throw error;
    }
  }

  async waitForService(url, serviceName, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (url.startsWith('http')) {
          const response = await fetch(url);
          if (response.ok || response.status < 500) {
            console.log(`✅ ${serviceName} is ready`);
            return;
          }
        } else {
          // For non-HTTP services, try a basic connection
          const { exec } = require('child_process');
          await new Promise((resolve, reject) => {
            exec(`curl -s ${url}`, (error) => {
              if (error) reject(error);
              else resolve();
            });
          });
          console.log(`✅ ${serviceName} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`${serviceName} did not become ready within ${timeout}ms`);
  }

  async verifyEnvironment() {
    console.log('🔍 Verifying test environment...');
    
    const checks = [
      { name: 'Application Server', url: this.config.apiUrl },
      { name: 'API Health', url: `${this.config.apiUrl}/api/health` },
      { name: 'Database Connection', check: () => this.checkDatabaseConnection() }
    ];
    
    for (const check of checks) {
      try {
        if (check.url) {
          const response = await fetch(check.url);
          if (!response.ok) {
            throw new Error(`${check.name} returned ${response.status}`);
          }
        } else if (check.check) {
          await check.check();
        }
        console.log(`✅ ${check.name} verified`);
      } catch (error) {
        console.error(`❌ ${check.name} verification failed:`, error);
        throw error;
      }
    }
  }

  async checkDatabaseConnection() {
    try {
      await execAsync('psql -c "SELECT 1" ' + this.config.dbUrl);
      return true;
    } catch (error) {
      throw new Error('Database connection failed');
    }
  }

  async cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Clean database
      if (this.config.dbMigrations) {
        await execAsync('psql -c "DROP DATABASE IF EXISTS test_db" ' + 
          this.config.dbUrl.replace('/test_db', '/postgres'));
      }
      
      // Clean test data directory
      const testDataDir = path.join(process.cwd(), 'test-data');
      if (fs.existsSync(testDataDir)) {
        fs.rmSync(testDataDir, { recursive: true, force: true });
      }
      
      console.log('✅ Test data cleanup complete');
      
    } catch (error) {
      console.error('❌ Test data cleanup failed:', error);
    }
  }

  async cleanupTempFiles() {
    console.log('🧹 Cleaning up temporary files...');
    
    const tempDirs = [
      'test-results',
      'playwright-report',
      'coverage',
      '.env.test'
    ];
    
    for (const item of tempDirs) {
      const fullPath = path.join(process.cwd(), item);
      try {
        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (stats.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up ${item}:`, error);
      }
    }
  }

  getConfig() {
    return { ...this.config };
  }

  updateConfig(updates) {
    Object.assign(this.config, updates);
  }

  isReady() {
    return this.isSetup;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const environment = new TestEnvironment();
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down...');
    await environment.teardown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down...');
    await environment.teardown();
    process.exit(0);
  });
  
  (async () => {
    try {
      switch (command) {
        case 'setup':
          await environment.setup();
          console.log('Environment is ready. Press Ctrl+C to teardown.');
          // Keep process alive
          await new Promise(() => {});
          break;
          
        case 'teardown':
          await environment.teardown();
          break;
          
        case 'verify':
          await environment.verifyEnvironment();
          break;
          
        default:
          console.log('Usage: node test-environment.js [setup|teardown|verify]');
          process.exit(1);
      }
    } catch (error) {
      console.error('Test environment error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { TestEnvironment };