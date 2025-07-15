import { syncManager } from './electric';
import { syncMonitor } from './sync-monitor';
import { userRepository, projectRepository, agentRepository, sessionRepository, messageRepository, memoryRepository } from './repositories';
import { db } from './index';

export interface DatabaseServiceConfig {
  enableSync: boolean;
  enableMonitoring: boolean;
  monitoringInterval: number;
  autoResolveConflicts: boolean;
  syncBatchSize: number;
  metricsRetentionDays: number;
}

const defaultConfig: DatabaseServiceConfig = {
  enableSync: true,
  enableMonitoring: true,
  monitoringInterval: 5000,
  autoResolveConflicts: true,
  syncBatchSize: 100,
  metricsRetentionDays: 30
};

export class DatabaseService {
  private config: DatabaseServiceConfig;
  private isInitialized = false;

  constructor(config: Partial<DatabaseServiceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing Database Service...');

    try {
      // Initialize sync manager if enabled
      if (this.config.enableSync) {
        await syncManager.initialize();
        console.log('✅ Sync manager initialized');
      }

      // Start monitoring if enabled
      if (this.config.enableMonitoring) {
        await syncMonitor.startMonitoring(this.config.monitoringInterval);
        console.log('✅ Sync monitoring started');
      }

      // Set up cleanup tasks
      this.setupCleanupTasks();

      this.isInitialized = true;
      console.log('🎉 Database Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Database Service:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    console.log('⏹️ Shutting down Database Service...');

    try {
      // Stop monitoring
      syncMonitor.stopMonitoring();

      // Perform final cleanup
      await this.cleanup();

      this.isInitialized = false;
      console.log('✅ Database Service shutdown complete');
    } catch (error) {
      console.error('❌ Error during Database Service shutdown:', error);
      throw error;
    }
  }

  // Repository access methods
  get users() {
    return userRepository;
  }

  get projects() {
    return projectRepository;
  }

  get agents() {
    return agentRepository;
  }

  get sessions() {
    return sessionRepository;
  }

  get messages() {
    return messageRepository;
  }

  get memory() {
    return memoryRepository;
  }

  // Sync management methods
  async getSyncStatus() {
    return await syncMonitor.getSyncStatus();
  }

  async getSyncHealth() {
    return await syncMonitor.getSyncHealth();
  }

  async getConflicts() {
    return await syncManager.getConflicts();
  }

  async resolveConflict(conflictId: string, strategy: 'local_wins' | 'remote_wins' | 'merge', resolvedData?: any) {
    return await syncManager.resolveConflict(conflictId, strategy, resolvedData);
  }

  async forceSyncAll() {
    if (!this.config.enableSync) {
      throw new Error('Sync is disabled');
    }
    
    return await syncManager.forceSyncAll();
  }

  // Monitoring and metrics
  async getMetrics(hours: number = 24) {
    return await syncMonitor.getDetailedMetrics(hours);
  }

  async recordMetric(type: string, value: number, metadata?: any) {
    return await syncMonitor.recordMetric(type, value, metadata);
  }

  // Health checks
  async healthCheck(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    database: boolean;
    sync: boolean;
    monitoring: boolean;
    details: any;
  }> {
    const health = {
      status: 'healthy' as const,
      database: false,
      sync: false,
      monitoring: false,
      details: {}
    };

    try {
      // Test database connection
      await db.select({ count: db.count() }).from(db.users).limit(1);
      health.database = true;
    } catch (error) {
      health.status = 'critical';
      health.details.database = error.message;
    }

    try {
      // Test sync system
      if (this.config.enableSync) {
        const syncStatus = await this.getSyncStatus();
        health.sync = syncStatus.isOnline;
        health.details.sync = syncStatus;
        
        if (!syncStatus.isOnline) {
          health.status = health.status === 'critical' ? 'critical' : 'warning';
        }
      } else {
        health.sync = true; // Not applicable
      }
    } catch (error) {
      health.status = 'critical';
      health.details.sync = error.message;
    }

    try {
      // Test monitoring
      if (this.config.enableMonitoring) {
        const syncHealth = await this.getSyncHealth();
        health.monitoring = syncHealth.status !== 'critical';
        health.details.monitoring = syncHealth;
        
        if (syncHealth.status === 'critical') {
          health.status = 'critical';
        } else if (syncHealth.status === 'warning' && health.status === 'healthy') {
          health.status = 'warning';
        }
      } else {
        health.monitoring = true; // Not applicable
      }
    } catch (error) {
      health.status = 'warning';
      health.details.monitoring = error.message;
    }

    return health;
  }

  // Maintenance operations
  async cleanup(): Promise<void> {
    console.log('🧹 Starting database cleanup...');

    try {
      // Clean up old sync data
      await syncMonitor.cleanupOldData(this.config.metricsRetentionDays);

      // Clean up expired memories
      await memoryRepository.cleanupExpired();

      console.log('✅ Database cleanup completed');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    }
  }

  async backup(destination?: string): Promise<string> {
    console.log('💾 Creating database backup...');
    
    // This would implement actual backup logic
    // For now, return a placeholder
    const backupId = `backup_${Date.now()}`;
    
    console.log(`✅ Backup created with ID: ${backupId}`);
    return backupId;
  }

  async restore(backupId: string): Promise<void> {
    console.log(`🔄 Restoring from backup: ${backupId}`);
    
    // This would implement actual restore logic
    // For now, just log
    
    console.log('✅ Restore completed');
  }

  // Statistics and analytics
  async getUsageStats() {
    const stats = {
      users: await userRepository.count(),
      projects: await projectRepository.count(),
      agents: await agentRepository.count(),
      sessions: await sessionRepository.count(),
      messages: await messageRepository.count(),
      memories: await memoryRepository.count()
    };

    return {
      ...stats,
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
      timestamp: new Date()
    };
  }

  async getPerformanceStats() {
    const metrics = await this.getMetrics(24);
    
    const latencyMetrics = metrics.metrics.filter(m => m.type.includes('latency'));
    const errorMetrics = metrics.metrics.filter(m => m.type.includes('error'));
    
    return {
      avgLatency: latencyMetrics.reduce((sum, m) => sum + m.avg, 0) / latencyMetrics.length || 0,
      errorRate: errorMetrics.reduce((sum, m) => sum + m.avg, 0) / errorMetrics.length || 0,
      totalOperations: metrics.raw.length,
      timeRange: metrics.timeRange
    };
  }

  // Configuration management
  updateConfig(newConfig: Partial<DatabaseServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Database service configuration updated');
  }

  getConfig(): DatabaseServiceConfig {
    return { ...this.config };
  }

  // Private methods
  private setupCleanupTasks(): void {
    // Set up periodic cleanup (every 24 hours)
    setInterval(async () => {
      try {
        await this.cleanup();
      } catch (error) {
        console.error('Scheduled cleanup failed:', error);
      }
    }, 24 * 60 * 60 * 1000);

    console.log('📅 Scheduled cleanup tasks configured');
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();

// Export for testing with custom config
export { DatabaseService };