import { faker } from '@faker-js/faker';
import { Page } from '@playwright/test';

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'viewer';
  createdAt: Date;
  preferences: UserPreferences;
  avatar?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
    allowAnalytics: boolean;
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    screenReader: boolean;
  };
}

export interface TestProject {
  id: string;
  name: string;
  description: string;
  owner: string;
  collaborators: string[];
  status: 'active' | 'archived' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  settings: ProjectSettings;
  metrics: ProjectMetrics;
}

export interface ProjectSettings {
  visibility: 'public' | 'private' | 'internal';
  allowContributions: boolean;
  requireApproval: boolean;
  autoSync: boolean;
  backupEnabled: boolean;
}

export interface ProjectMetrics {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface TestAgent {
  id: string;
  name: string;
  type: 'coder' | 'analyst' | 'researcher' | 'tester' | 'coordinator';
  status: 'idle' | 'busy' | 'offline' | 'error';
  capabilities: string[];
  maxConcurrentTasks: number;
  currentTasks: number;
  createdAt: Date;
  lastActive: Date;
  metrics: AgentMetrics;
  configuration: AgentConfiguration;
}

export interface AgentMetrics {
  tasksCompleted: number;
  tasksInProgress: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
  throughput: number;
}

export interface AgentConfiguration {
  timeout: number;
  retryAttempts: number;
  priority: 'low' | 'medium' | 'high';
  autoRestart: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export interface TestMessage {
  id: string;
  type: 'request' | 'response' | 'broadcast' | 'event';
  senderId: string;
  receiverId?: string;
  content: any;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  correlationId?: string;
}

export interface TestDataManagerConfig {
  seedData: boolean;
  persistData: boolean;
  cleanupAfterTests: boolean;
  enableRealTimeSync: boolean;
  mockExternalServices: boolean;
  dataDirectory: string;
  backupEnabled: boolean;
}

export interface DataSnapshot {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  data: {
    users: TestUser[];
    projects: TestProject[];
    agents: TestAgent[];
    messages: TestMessage[];
  };
  metadata: {
    version: string;
    testSuite: string;
    environment: string;
  };
}

export interface TestSession {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  testFiles: string[];
  dataSnapshots: string[];
  metrics: {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    totalDuration: number;
  };
}

/**
 * Test Data Manager for comprehensive test data generation, management, and cleanup
 */
export class TestDataManager {
  private page: Page;
  private config: Required<TestDataManagerConfig>;
  private users: Map<string, TestUser> = new Map();
  private projects: Map<string, TestProject> = new Map();
  private agents: Map<string, TestAgent> = new Map();
  private messages: Map<string, TestMessage> = new Map();
  private snapshots: Map<string, DataSnapshot> = new Map();
  private sessions: Map<string, TestSession> = new Map();
  private activeSession?: TestSession;

  constructor(page: Page, config: Partial<TestDataManagerConfig> = {}) {
    this.page = page;
    this.config = {
      seedData: config.seedData ?? true,
      persistData: config.persistData ?? false,
      cleanupAfterTests: config.cleanupAfterTests ?? true,
      enableRealTimeSync: config.enableRealTimeSync ?? false,
      mockExternalServices: config.mockExternalServices ?? true,
      dataDirectory: config.dataDirectory ?? './test-data',
      backupEnabled: config.backupEnabled ?? false,
    };
  }

  /**
   * Initialize test data manager and seed initial data
   */
  async initialize(): Promise<void> {
    if (this.config.seedData) {
      await this.seedDefaultData();
    }

    if (this.config.mockExternalServices) {
      await this.setupMockServices();
    }

    if (this.config.enableRealTimeSync) {
      await this.setupRealTimeSync();
    }
  }

  /**
   * Create a new test session
   */
  async createSession(name: string, testFiles: string[]): Promise<TestSession> {
    const session: TestSession = {
      id: faker.string.uuid(),
      name,
      startTime: new Date(),
      status: 'active',
      testFiles,
      dataSnapshots: [],
      metrics: {
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        totalDuration: 0,
      },
    };

    this.sessions.set(session.id, session);
    this.activeSession = session;
    return session;
  }

  /**
   * End the current test session
   */
  async endSession(sessionId: string, status: 'completed' | 'failed' | 'cancelled' = 'completed'): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.endTime = new Date();
    session.status = status;
    session.metrics.totalDuration = session.endTime.getTime() - session.startTime.getTime();

    if (this.activeSession?.id === sessionId) {
      this.activeSession = undefined;
    }

    if (this.config.cleanupAfterTests && status === 'completed') {
      await this.cleanup();
    }
  }

  /**
   * Generate test users with various roles and configurations
   */
  async generateUsers(count: number = 10): Promise<TestUser[]> {
    const users: TestUser[] = [];
    const roles: ('admin' | 'user' | 'viewer')[] = ['admin', 'user', 'viewer'];

    for (let i = 0; i < count; i++) {
      const user: TestUser = {
        id: faker.string.uuid(),
        email: faker.internet.email(),
        password: faker.internet.password({ length: 12 }),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: roles[i % roles.length],
        createdAt: faker.date.past(),
        preferences: {
          theme: faker.helpers.arrayElement(['light', 'dark', 'system']),
          notifications: {
            email: faker.datatype.boolean(),
            push: faker.datatype.boolean(),
            desktop: faker.datatype.boolean(),
          },
          privacy: {
            showProfile: faker.datatype.boolean(),
            showActivity: faker.datatype.boolean(),
            allowAnalytics: faker.datatype.boolean(),
          },
          accessibility: {
            reducedMotion: faker.datatype.boolean(),
            highContrast: faker.datatype.boolean(),
            screenReader: faker.datatype.boolean(),
          },
        },
        avatar: faker.image.avatar(),
      };

      users.push(user);
      this.users.set(user.id, user);
    }

    return users;
  }

  /**
   * Generate test projects with realistic data
   */
  async generateProjects(count: number = 5, ownerId?: string): Promise<TestProject[]> {
    const projects: TestProject[] = [];
    const statuses: ('active' | 'archived' | 'draft')[] = ['active', 'archived', 'draft'];

    for (let i = 0; i < count; i++) {
      const project: TestProject = {
        id: faker.string.uuid(),
        name: faker.company.name(),
        description: faker.lorem.paragraph(),
        owner: ownerId || faker.string.uuid(),
        collaborators: faker.helpers.arrayElements(
          Array.from(this.users.keys()),
          { min: 1, max: 5 }
        ),
        status: statuses[i % statuses.length],
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
        settings: {
          visibility: faker.helpers.arrayElement(['public', 'private', 'internal']),
          allowContributions: faker.datatype.boolean(),
          requireApproval: faker.datatype.boolean(),
          autoSync: faker.datatype.boolean(),
          backupEnabled: faker.datatype.boolean(),
        },
        metrics: {
          totalAgents: faker.number.int({ min: 1, max: 20 }),
          activeAgents: faker.number.int({ min: 0, max: 15 }),
          totalTasks: faker.number.int({ min: 10, max: 1000 }),
          completedTasks: faker.number.int({ min: 5, max: 800 }),
          averageResponseTime: faker.number.int({ min: 100, max: 5000 }),
          errorRate: faker.number.float({ min: 0, max: 0.1 }),
          uptime: faker.number.float({ min: 0.8, max: 1.0 }),
        },
      };

      projects.push(project);
      this.projects.set(project.id, project);
    }

    return projects;
  }

  /**
   * Generate test agents with different types and configurations
   */
  async generateAgents(count: number = 15, projectId?: string): Promise<TestAgent[]> {
    const agents: TestAgent[] = [];
    const types: ('coder' | 'analyst' | 'researcher' | 'tester' | 'coordinator')[] = [
      'coder', 'analyst', 'researcher', 'tester', 'coordinator'
    ];
    const statuses: ('idle' | 'busy' | 'offline' | 'error')[] = ['idle', 'busy', 'offline', 'error'];

    for (let i = 0; i < count; i++) {
      const agent: TestAgent = {
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        type: types[i % types.length],
        status: statuses[i % statuses.length],
        capabilities: faker.helpers.arrayElements([
          'code_generation', 'data_analysis', 'research', 'testing', 'coordination',
          'documentation', 'optimization', 'security', 'deployment', 'monitoring'
        ], { min: 2, max: 6 }),
        maxConcurrentTasks: faker.number.int({ min: 1, max: 10 }),
        currentTasks: faker.number.int({ min: 0, max: 5 }),
        createdAt: faker.date.past(),
        lastActive: faker.date.recent(),
        metrics: {
          tasksCompleted: faker.number.int({ min: 0, max: 1000 }),
          tasksInProgress: faker.number.int({ min: 0, max: 5 }),
          averageResponseTime: faker.number.int({ min: 100, max: 3000 }),
          errorRate: faker.number.float({ min: 0, max: 0.15 }),
          uptime: faker.number.float({ min: 0.7, max: 1.0 }),
          throughput: faker.number.int({ min: 1, max: 50 }),
        },
        configuration: {
          timeout: faker.number.int({ min: 5000, max: 60000 }),
          retryAttempts: faker.number.int({ min: 1, max: 5 }),
          priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
          autoRestart: faker.datatype.boolean(),
          logLevel: faker.helpers.arrayElement(['error', 'warn', 'info', 'debug']),
        },
      };

      agents.push(agent);
      this.agents.set(agent.id, agent);
    }

    return agents;
  }

  /**
   * Generate test messages for communication testing
   */
  async generateMessages(count: number = 50): Promise<TestMessage[]> {
    const messages: TestMessage[] = [];
    const types: ('request' | 'response' | 'broadcast' | 'event')[] = [
      'request', 'response', 'broadcast', 'event'
    ];
    const priorities: ('low' | 'medium' | 'high' | 'urgent')[] = ['low', 'medium', 'high', 'urgent'];
    const statuses: ('pending' | 'sent' | 'delivered' | 'failed')[] = ['pending', 'sent', 'delivered', 'failed'];

    const agentIds = Array.from(this.agents.keys());

    for (let i = 0; i < count; i++) {
      const message: TestMessage = {
        id: faker.string.uuid(),
        type: types[i % types.length],
        senderId: faker.helpers.arrayElement(agentIds),
        receiverId: faker.datatype.boolean() ? faker.helpers.arrayElement(agentIds) : undefined,
        content: {
          action: faker.helpers.arrayElement([
            'execute_task', 'get_status', 'update_metrics', 'send_notification',
            'process_data', 'generate_report', 'sync_data', 'backup_data'
          ]),
          data: {
            taskId: faker.string.uuid(),
            payload: faker.lorem.sentence(),
            timestamp: faker.date.recent(),
          },
        },
        timestamp: faker.date.recent(),
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        correlationId: faker.datatype.boolean() ? faker.string.uuid() : undefined,
      };

      messages.push(message);
      this.messages.set(message.id, message);
    }

    return messages;
  }

  /**
   * Create a data snapshot for test state management
   */
  async createSnapshot(name: string, description: string = ''): Promise<DataSnapshot> {
    const snapshot: DataSnapshot = {
      id: faker.string.uuid(),
      name,
      description,
      createdAt: new Date(),
      data: {
        users: Array.from(this.users.values()),
        projects: Array.from(this.projects.values()),
        agents: Array.from(this.agents.values()),
        messages: Array.from(this.messages.values()),
      },
      metadata: {
        version: '1.0.0',
        testSuite: this.activeSession?.name || 'unknown',
        environment: process.env.NODE_ENV || 'test',
      },
    };

    this.snapshots.set(snapshot.id, snapshot);

    if (this.activeSession) {
      this.activeSession.dataSnapshots.push(snapshot.id);
    }

    return snapshot;
  }

  /**
   * Restore data from a snapshot
   */
  async restoreSnapshot(snapshotId: string): Promise<void> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    // Clear current data
    this.users.clear();
    this.projects.clear();
    this.agents.clear();
    this.messages.clear();

    // Restore data from snapshot
    snapshot.data.users.forEach(user => this.users.set(user.id, user));
    snapshot.data.projects.forEach(project => this.projects.set(project.id, project));
    snapshot.data.agents.forEach(agent => this.agents.set(agent.id, agent));
    snapshot.data.messages.forEach(message => this.messages.set(message.id, message));

    // Sync with page if real-time sync is enabled
    if (this.config.enableRealTimeSync) {
      await this.syncWithPage();
    }
  }

  /**
   * Get test data by type
   */
  getUsers(): TestUser[] {
    return Array.from(this.users.values());
  }

  getProjects(): TestProject[] {
    return Array.from(this.projects.values());
  }

  getAgents(): TestAgent[] {
    return Array.from(this.agents.values());
  }

  getMessages(): TestMessage[] {
    return Array.from(this.messages.values());
  }

  /**
   * Get specific test data by ID
   */
  getUser(id: string): TestUser | undefined {
    return this.users.get(id);
  }

  getProject(id: string): TestProject | undefined {
    return this.projects.get(id);
  }

  getAgent(id: string): TestAgent | undefined {
    return this.agents.get(id);
  }

  getMessage(id: string): TestMessage | undefined {
    return this.messages.get(id);
  }

  /**
   * Filter test data by criteria
   */
  getUsersByRole(role: 'admin' | 'user' | 'viewer'): TestUser[] {
    return Array.from(this.users.values()).filter(user => user.role === role);
  }

  getProjectsByStatus(status: 'active' | 'archived' | 'draft'): TestProject[] {
    return Array.from(this.projects.values()).filter(project => project.status === status);
  }

  getAgentsByType(type: 'coder' | 'analyst' | 'researcher' | 'tester' | 'coordinator'): TestAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  getAgentsByStatus(status: 'idle' | 'busy' | 'offline' | 'error'): TestAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.status === status);
  }

  /**
   * Create test data for specific scenarios
   */
  async createUserRegistrationScenario(): Promise<{ user: TestUser; project: TestProject }> {
    const users = await this.generateUsers(1);
    const projects = await this.generateProjects(1, users[0].id);
    
    return {
      user: users[0],
      project: projects[0],
    };
  }

  async createAgentWorkflowScenario(): Promise<{
    coordinator: TestAgent;
    workers: TestAgent[];
    project: TestProject;
    messages: TestMessage[];
  }> {
    const projects = await this.generateProjects(1);
    const agents = await this.generateAgents(5, projects[0].id);
    const messages = await this.generateMessages(20);

    const coordinator = agents.find(agent => agent.type === 'coordinator') || agents[0];
    const workers = agents.filter(agent => agent.type !== 'coordinator');

    return {
      coordinator,
      workers,
      project: projects[0],
      messages,
    };
  }

  async createErrorHandlingScenario(): Promise<{
    failingAgents: TestAgent[];
    errorMessages: TestMessage[];
    project: TestProject;
  }> {
    const projects = await this.generateProjects(1);
    const agents = await this.generateAgents(3, projects[0].id);
    
    // Set agents to error state
    agents.forEach(agent => {
      agent.status = 'error';
      agent.metrics.errorRate = 0.8;
    });

    const messages = await this.generateMessages(10);
    // Set messages to failed state
    messages.forEach(message => {
      message.status = 'failed';
    });

    return {
      failingAgents: agents,
      errorMessages: messages,
      project: projects[0],
    };
  }

  /**
   * Update test data dynamically
   */
  async updateUserStatus(userId: string, updates: Partial<TestUser>): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    Object.assign(user, updates);
    this.users.set(userId, user);

    if (this.config.enableRealTimeSync) {
      await this.syncUserWithPage(user);
    }
  }

  async updateAgentStatus(agentId: string, status: 'idle' | 'busy' | 'offline' | 'error'): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = status;
    agent.lastActive = new Date();
    this.agents.set(agentId, agent);

    if (this.config.enableRealTimeSync) {
      await this.syncAgentWithPage(agent);
    }
  }

  async updateProjectMetrics(projectId: string, metrics: Partial<ProjectMetrics>): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    Object.assign(project.metrics, metrics);
    project.updatedAt = new Date();
    this.projects.set(projectId, project);

    if (this.config.enableRealTimeSync) {
      await this.syncProjectWithPage(project);
    }
  }

  /**
   * Seed default test data
   */
  private async seedDefaultData(): Promise<void> {
    // Create admin user
    const adminUser: TestUser = {
      id: 'admin-user-1',
      email: 'admin@test.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date(),
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: true,
          desktop: true,
        },
        privacy: {
          showProfile: true,
          showActivity: true,
          allowAnalytics: true,
        },
        accessibility: {
          reducedMotion: false,
          highContrast: false,
          screenReader: false,
        },
      },
    };

    this.users.set(adminUser.id, adminUser);

    // Generate additional test data
    await this.generateUsers(5);
    await this.generateProjects(3, adminUser.id);
    await this.generateAgents(10);
    await this.generateMessages(30);
  }

  /**
   * Setup mock services for external dependencies
   */
  private async setupMockServices(): Promise<void> {
    // Mock API endpoints
    await this.page.route('**/api/users/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: Array.from(this.users.values()) }),
      });
    });

    await this.page.route('**/api/projects/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: Array.from(this.projects.values()) }),
      });
    });

    await this.page.route('**/api/agents/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: Array.from(this.agents.values()) }),
      });
    });

    // Mock WebSocket connections
    await this.page.addInitScript(() => {
      // Mock WebSocket for real-time updates
      class MockWebSocket {
        constructor(url: string) {
          setTimeout(() => {
            this.onopen?.({} as Event);
          }, 100);
        }
        
        send(data: string) {
          console.log('Mock WebSocket send:', data);
        }
        
        close() {
          this.onclose?.({} as CloseEvent);
        }
        
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;
      }
      
      (window as any).WebSocket = MockWebSocket;
    });
  }

  /**
   * Setup real-time sync between test data and page
   */
  private async setupRealTimeSync(): Promise<void> {
    // Inject real-time sync script
    await this.page.addInitScript(() => {
      (window as any).testDataSync = {
        users: new Map(),
        projects: new Map(),
        agents: new Map(),
        messages: new Map(),
      };
    });
  }

  /**
   * Sync specific data with page
   */
  private async syncUserWithPage(user: TestUser): Promise<void> {
    await this.page.evaluate((userData) => {
      (window as any).testDataSync.users.set(userData.id, userData);
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('userDataUpdated', { detail: userData }));
    }, user);
  }

  private async syncAgentWithPage(agent: TestAgent): Promise<void> {
    await this.page.evaluate((agentData) => {
      (window as any).testDataSync.agents.set(agentData.id, agentData);
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('agentDataUpdated', { detail: agentData }));
    }, agent);
  }

  private async syncProjectWithPage(project: TestProject): Promise<void> {
    await this.page.evaluate((projectData) => {
      (window as any).testDataSync.projects.set(projectData.id, projectData);
      // Trigger custom event for UI updates
      window.dispatchEvent(new CustomEvent('projectDataUpdated', { detail: projectData }));
    }, project);
  }

  /**
   * Sync all data with page
   */
  private async syncWithPage(): Promise<void> {
    await this.page.evaluate((testData) => {
      (window as any).testDataSync = testData;
      // Trigger custom event for full data sync
      window.dispatchEvent(new CustomEvent('fullDataSync', { detail: testData }));
    }, {
      users: Array.from(this.users.entries()),
      projects: Array.from(this.projects.entries()),
      agents: Array.from(this.agents.entries()),
      messages: Array.from(this.messages.entries()),
    });
  }

  /**
   * Clean up test data and resources
   */
  async cleanup(): Promise<void> {
    // Clear all data
    this.users.clear();
    this.projects.clear();
    this.agents.clear();
    this.messages.clear();
    this.snapshots.clear();

    // Clear page data
    await this.page.evaluate(() => {
      if ((window as any).testDataSync) {
        (window as any).testDataSync = {
          users: new Map(),
          projects: new Map(),
          agents: new Map(),
          messages: new Map(),
        };
      }
    });

    // Remove route handlers
    await this.page.unroute('**/api/users/**');
    await this.page.unroute('**/api/projects/**');
    await this.page.unroute('**/api/agents/**');
  }

  /**
   * Export test data for external use
   */
  async exportData(): Promise<{
    users: TestUser[];
    projects: TestProject[];
    agents: TestAgent[];
    messages: TestMessage[];
    snapshots: DataSnapshot[];
    sessions: TestSession[];
  }> {
    return {
      users: Array.from(this.users.values()),
      projects: Array.from(this.projects.values()),
      agents: Array.from(this.agents.values()),
      messages: Array.from(this.messages.values()),
      snapshots: Array.from(this.snapshots.values()),
      sessions: Array.from(this.sessions.values()),
    };
  }

  /**
   * Import test data from external source
   */
  async importData(data: {
    users?: TestUser[];
    projects?: TestProject[];
    agents?: TestAgent[];
    messages?: TestMessage[];
  }): Promise<void> {
    if (data.users) {
      data.users.forEach(user => this.users.set(user.id, user));
    }
    if (data.projects) {
      data.projects.forEach(project => this.projects.set(project.id, project));
    }
    if (data.agents) {
      data.agents.forEach(agent => this.agents.set(agent.id, agent));
    }
    if (data.messages) {
      data.messages.forEach(message => this.messages.set(message.id, message));
    }

    if (this.config.enableRealTimeSync) {
      await this.syncWithPage();
    }
  }

  /**
   * Get test data statistics
   */
  getStatistics(): {
    totalUsers: number;
    totalProjects: number;
    totalAgents: number;
    totalMessages: number;
    totalSnapshots: number;
    totalSessions: number;
    activeAgents: number;
    activeProjects: number;
    memoryUsage: number;
  } {
    return {
      totalUsers: this.users.size,
      totalProjects: this.projects.size,
      totalAgents: this.agents.size,
      totalMessages: this.messages.size,
      totalSnapshots: this.snapshots.size,
      totalSessions: this.sessions.size,
      activeAgents: Array.from(this.agents.values()).filter(agent => agent.status !== 'offline').length,
      activeProjects: Array.from(this.projects.values()).filter(project => project.status === 'active').length,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
  }
}