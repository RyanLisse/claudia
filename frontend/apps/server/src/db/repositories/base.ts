import { db } from '../index';
import { syncManager } from '../electric';
import { syncMonitor } from '../sync-monitor';
import { SQL, and, eq } from 'drizzle-orm';

export abstract class BaseRepository<T, TInsert> {
  protected abstract tableName: string;
  protected abstract table: any;

  constructor() {
    // Initialize sync for this table
    this.initializeSync();
  }

  private async initializeSync(): Promise<void> {
    try {
      await syncManager.initialize();
      await syncManager.syncTable(this.tableName);
    } catch (error) {
      console.warn(`Failed to initialize sync for ${this.tableName}:`, error);
    }
  }

  async findById(id: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      const result = await db
        .select()
        .from(this.table)
        .where(eq(this.table.id, id))
        .limit(1);

      await this.recordMetric('read_latency', Date.now() - startTime);
      
      return result[0] || null;
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  async findMany(where?: SQL, limit?: number, offset?: number): Promise<T[]> {
    const startTime = Date.now();
    
    try {
      let query = db.select().from(this.table);
      
      if (where) {
        query = query.where(where);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      if (offset) {
        query = query.offset(offset);
      }

      const result = await query;
      
      await this.recordMetric('read_latency', Date.now() - startTime);
      await this.recordMetric('records_read', result.length);
      
      return result;
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  async create(data: TInsert): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Add sync metadata
      const dataWithSync = {
        ...data,
        electricId: this.generateElectricId(),
        syncVersion: '1',
        lastSyncAt: new Date()
      };

      const result = await db
        .insert(this.table)
        .values(dataWithSync)
        .returning();

      await this.recordMetric('write_latency', Date.now() - startTime);
      await this.recordMetric('records_created', 1);
      
      // Record sync event
      await this.recordSyncEvent('create', result[0].id, null, result[0]);
      
      return result[0];
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  async update(id: string, data: Partial<TInsert>): Promise<T> {
    const startTime = Date.now();
    
    try {
      // Get current data for sync event
      const current = await this.findById(id);
      if (!current) {
        throw new Error(`Record with id ${id} not found`);
      }

      // Add sync metadata
      const dataWithSync = {
        ...data,
        syncVersion: this.incrementSyncVersion(current.syncVersion),
        lastSyncAt: new Date()
      };

      const result = await db
        .update(this.table)
        .set(dataWithSync)
        .where(eq(this.table.id, id))
        .returning();

      await this.recordMetric('write_latency', Date.now() - startTime);
      await this.recordMetric('records_updated', 1);
      
      // Record sync event
      await this.recordSyncEvent('update', id, current, result[0]);
      
      return result[0];
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Get current data for sync event
      const current = await this.findById(id);
      if (!current) {
        return false;
      }

      const result = await db
        .delete(this.table)
        .where(eq(this.table.id, id));

      await this.recordMetric('write_latency', Date.now() - startTime);
      await this.recordMetric('records_deleted', 1);
      
      // Record sync event
      await this.recordSyncEvent('delete', id, current, null);
      
      return true;
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  async count(where?: SQL): Promise<number> {
    const startTime = Date.now();
    
    try {
      let query = db.select({ count: db.count() }).from(this.table);
      
      if (where) {
        query = query.where(where);
      }

      const result = await query;
      
      await this.recordMetric('read_latency', Date.now() - startTime);
      
      return result[0]?.count || 0;
    } catch (error) {
      await this.recordMetric('error_count', 1);
      throw error;
    }
  }

  protected async recordMetric(type: string, value: number): Promise<void> {
    try {
      await syncMonitor.recordMetric(`${this.tableName}_${type}`, value, {
        table: this.tableName,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Don't throw on metric recording errors
      console.warn('Failed to record metric:', error);
    }
  }

  protected async recordSyncEvent(
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    oldData: any,
    newData: any
  ): Promise<void> {
    try {
      await db.insert(db.syncEvents).values({
        eventType: operation,
        tableName: this.tableName,
        recordId,
        operation,
        oldData,
        newData,
        syncVersion: this.generateSyncVersion(),
        clientId: process.env.CLIENT_ID || 'server',
        userId: this.getCurrentUserId()
      });
    } catch (error) {
      console.warn('Failed to record sync event:', error);
    }
  }

  protected generateElectricId(): string {
    return `${this.tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  protected generateSyncVersion(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  }

  protected incrementSyncVersion(currentVersion: string): string {
    const parts = currentVersion.split('_');
    const timestamp = parseInt(parts[0]) || Date.now();
    return `${timestamp + 1}_${Math.random().toString(36).substr(2, 5)}`;
  }

  protected getCurrentUserId(): string | undefined {
    // TODO: Implement based on your authentication system
    return process.env.CURRENT_USER_ID;
  }
}

export interface Repository<T, TInsert> {
  findById(id: string): Promise<T | null>;
  findMany(where?: SQL, limit?: number, offset?: number): Promise<T[]>;
  create(data: TInsert): Promise<T>;
  update(id: string, data: Partial<TInsert>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(where?: SQL): Promise<number>;
}