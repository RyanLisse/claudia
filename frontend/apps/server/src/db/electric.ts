import { Electric, ElectricDatabase } from 'electric-sql/browser';
import { ElectricConfig } from 'electric-sql';
import { schema } from './schema';

// ElectricSQL configuration
export const electricConfig: ElectricConfig = {
  url: process.env.ELECTRIC_URL || 'ws://localhost:5133',
  debug: process.env.NODE_ENV === 'development',
  timeout: 10000,
  migration: {
    // Enable automatic migrations
    auto: true,
    // Custom migration strategy
    strategy: 'on_demand'
  }
};

// Initialize Electric client
let electric: Electric | null = null;

export async function initElectric(): Promise<Electric> {
  if (electric) return electric;

  try {
    // Initialize the Electric client
    electric = await Electric.create({
      config: electricConfig,
      schema,
      // Database adapter configuration
      adapter: {
        // Use IndexedDB for browser persistence
        name: 'idb',
        options: {
          databaseName: 'claudia_electric',
          version: 1
        }
      }
    });

    // Set up sync subscriptions for all tables
    await setupSyncSubscriptions(electric);

    console.log('✅ ElectricSQL initialized successfully');
    return electric;
  } catch (error) {
    console.error('❌ Failed to initialize ElectricSQL:', error);
    throw error;
  }
}

// Set up sync subscriptions for real-time data
async function setupSyncSubscriptions(electric: Electric) {
  const { db } = electric;

  try {
    // Subscribe to users table
    await db.users.sync();
    
    // Subscribe to projects table
    await db.projects.sync();
    
    // Subscribe to agents table
    await db.agents.sync();
    
    // Subscribe to sessions table with shape filtering
    await db.sessions.sync({
      // Only sync active sessions
      where: { status: 'active' }
    });
    
    // Subscribe to messages table with limits
    await db.messages.sync({
      // Only sync recent messages
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    
    // Subscribe to memory table with user filtering
    await db.memory.sync({
      // Sync based on current user (to be set dynamically)
      where: { userId: getCurrentUserId() }
    });
    
    // Subscribe to sync events for monitoring
    await db.syncEvents.sync({
      where: {
        status: ['pending', 'conflict']
      }
    });

    console.log('✅ Sync subscriptions established');
  } catch (error) {
    console.error('❌ Failed to setup sync subscriptions:', error);
    throw error;
  }
}

// Get current user ID (implement based on your auth system)
function getCurrentUserId(): string {
  // TODO: Implement based on your authentication system
  return process.env.CURRENT_USER_ID || '';
}

// Sync utilities
export class ElectricSyncManager {
  private electric: Electric | null = null;

  async initialize(): Promise<void> {
    this.electric = await initElectric();
  }

  async syncTable(tableName: string, shape?: any): Promise<void> {
    if (!this.electric) throw new Error('Electric not initialized');
    
    const { db } = this.electric;
    const table = (db as any)[tableName];
    
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }

    await table.sync(shape);
  }

  async forceSyncAll(): Promise<void> {
    if (!this.electric) throw new Error('Electric not initialized');
    
    // Force sync all subscribed tables
    await setupSyncSubscriptions(this.electric);
  }

  async getConflicts(): Promise<any[]> {
    if (!this.electric) throw new Error('Electric not initialized');
    
    const { db } = this.electric;
    return await db.syncConflicts.findMany({
      where: { isResolved: false }
    });
  }

  async resolveConflict(conflictId: string, strategy: 'local_wins' | 'remote_wins' | 'merge', resolvedData?: any): Promise<void> {
    if (!this.electric) throw new Error('Electric not initialized');
    
    const { db } = this.electric;
    
    await db.syncConflicts.update({
      where: { id: conflictId },
      data: {
        resolutionStrategy: strategy,
        resolvedData,
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: getCurrentUserId()
      }
    });
  }

  async getSyncMetrics(): Promise<any> {
    if (!this.electric) throw new Error('Electric not initialized');
    
    const { db } = this.electric;
    
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const metrics = await db.syncMetrics.findMany({
      where: {
        measuredAt: {
          gte: hourAgo
        }
      },
      orderBy: { measuredAt: 'desc' }
    });

    return {
      totalEvents: metrics.length,
      avgLatency: metrics
        .filter(m => m.metricType === 'sync_latency')
        .reduce((sum, m) => sum + m.value, 0) / metrics.length || 0,
      conflictRate: metrics
        .filter(m => m.metricType === 'conflict_rate')
        .reduce((sum, m) => sum + m.value, 0) / metrics.length || 0,
      lastSync: metrics[0]?.measuredAt || null
    };
  }
}

// Export singleton instance
export const syncManager = new ElectricSyncManager();

// Utility functions for conflict resolution
export class ConflictResolver {
  static localWins(conflict: any): any {
    return conflict.localData;
  }

  static remoteWins(conflict: any): any {
    return conflict.remoteData;
  }

  static merge(conflict: any): any {
    // Implement 3-way merge logic
    const local = conflict.localData;
    const remote = conflict.remoteData;
    const base = conflict.baseData;

    // Simple merge strategy - prefer non-null values
    const merged = { ...base };
    
    Object.keys(local).forEach(key => {
      if (local[key] !== base[key] && remote[key] === base[key]) {
        merged[key] = local[key]; // Local change only
      } else if (remote[key] !== base[key] && local[key] === base[key]) {
        merged[key] = remote[key]; // Remote change only
      } else if (local[key] !== remote[key]) {
        // Conflict - prefer local by default
        merged[key] = local[key];
      }
    });

    return merged;
  }

  static async autoResolve(conflict: any): Promise<any> {
    switch (conflict.conflictType) {
      case 'concurrent_update':
        // Use timestamp-based resolution
        if (conflict.localData.updatedAt > conflict.remoteData.updatedAt) {
          return this.localWins(conflict);
        } else {
          return this.remoteWins(conflict);
        }
      
      case 'delete_update':
        // Prefer deletion
        return null;
      
      case 'unique_violation':
        // Use merge strategy
        return this.merge(conflict);
      
      default:
        return this.merge(conflict);
    }
  }
}

export { electric };