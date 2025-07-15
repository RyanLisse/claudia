import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { setupTestDatabase, cleanupTestDatabase, clearAllTables, testDataFactory, createMockSyncEvent, TestTimer, waitFor } from './setup';
import { syncManager, ConflictResolver } from '../electric';
import { syncMonitor } from '../sync-monitor';
import { userRepository } from '../repositories';
import { db } from '../index';
import { syncEvents, syncConflicts, syncMetrics } from '../schema/sync';

describe('Sync System', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    await clearAllTables();
  });

  describe('SyncMonitor', () => {
    it('should record metrics', async () => {
      await syncMonitor.recordMetric('test_latency', 150, { test: 'data' });
      
      const metrics = await db
        .select()
        .from(syncMetrics)
        .where(eq(syncMetrics.metricType, 'test_latency'));
      
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(150);
      expect(metrics[0].unit).toBe('ms');
      expect(metrics[0].metadata).toEqual({ test: 'data' });
    });

    it('should get sync status', async () => {
      // Create some test sync events
      const user = await userRepository.create(testDataFactory.createUser());
      
      await db.insert(syncEvents).values(createMockSyncEvent('users', user.id, 'insert'));
      await db.insert(syncEvents).values({
        ...createMockSyncEvent('users', user.id, 'update'),
        status: 'applied',
        appliedAt: new Date()
      });

      const status = await syncMonitor.getSyncStatus();
      
      expect(status.pendingEvents).toBe(1);
      expect(status.conflicts).toBe(0);
      expect(status.lastSync).toBeDefined();
    });

    it('should calculate sync health', async () => {
      // Test healthy state
      let health = await syncMonitor.getSyncHealth();
      expect(health.status).toBe('healthy');
      expect(health.score).toBeGreaterThanOrEqual(80);

      // Create high latency metric to trigger warning
      await syncMonitor.recordMetric('sync_latency', 3000); // 3 seconds
      
      health = await syncMonitor.getSyncHealth();
      expect(health.score).toBeLessThan(100);
      expect(health.issues.some(issue => issue.includes('latency'))).toBe(true);
    });

    it('should detect critical health issues', async () => {
      // Create multiple conflicts
      for (let i = 0; i < 15; i++) {
        await db.insert(syncConflicts).values({
          tableName: 'users',
          recordId: `test-${i}`,
          conflictType: 'concurrent_update',
          localData: { test: 'local' },
          remoteData: { test: 'remote' },
          isResolved: false
        });
      }

      // Create high latency
      await syncMonitor.recordMetric('sync_latency', 8000); // 8 seconds

      const health = await syncMonitor.getSyncHealth();
      expect(health.status).toBe('critical');
      expect(health.score).toBeLessThan(60);
      expect(health.issues.length).toBeGreaterThan(1);
      expect(health.recommendations.length).toBeGreaterThan(0);
    });

    it('should provide detailed metrics', async () => {
      // Record various metrics
      await syncMonitor.recordMetric('sync_latency', 100);
      await syncMonitor.recordMetric('sync_latency', 200);
      await syncMonitor.recordMetric('bandwidth_usage', 1024);
      await syncMonitor.recordMetric('conflict_rate', 5);

      const metrics = await syncMonitor.getDetailedMetrics(24);
      
      expect(metrics.timeRange.since).toBeDefined();
      expect(metrics.timeRange.until).toBeDefined();
      expect(metrics.metrics.length).toBeGreaterThan(0);

      const latencyMetric = metrics.metrics.find(m => m.type === 'sync_latency');
      expect(latencyMetric).toBeDefined();
      expect(latencyMetric?.count).toBe(2);
      expect(latencyMetric?.avg).toBe(150);
      expect(latencyMetric?.min).toBe(100);
      expect(latencyMetric?.max).toBe(200);
    });

    it('should monitor sync status in real-time', async () => {
      let statusUpdates = 0;
      let lastStatus: any = null;

      const unsubscribe = syncMonitor.subscribe((status) => {
        statusUpdates++;
        lastStatus = status;
      });

      // Start monitoring with short interval
      await syncMonitor.startMonitoring(100);

      // Wait for at least one status update
      await waitFor(async () => statusUpdates > 0, 2000);

      expect(statusUpdates).toBeGreaterThan(0);
      expect(lastStatus).toBeDefined();
      expect(lastStatus.isOnline).toBeDefined();
      expect(lastStatus.pendingEvents).toBeDefined();

      syncMonitor.stopMonitoring();
      unsubscribe();
    });
  });

  describe('ConflictResolver', () => {
    const mockConflict = {
      localData: { id: '1', name: 'Local Name', updatedAt: new Date('2023-01-02') },
      remoteData: { id: '1', name: 'Remote Name', updatedAt: new Date('2023-01-01') },
      baseData: { id: '1', name: 'Base Name', updatedAt: new Date('2023-01-01') }
    };

    it('should resolve with local wins strategy', () => {
      const result = ConflictResolver.localWins(mockConflict);
      expect(result).toEqual(mockConflict.localData);
    });

    it('should resolve with remote wins strategy', () => {
      const result = ConflictResolver.remoteWins(mockConflict);
      expect(result).toEqual(mockConflict.remoteData);
    });

    it('should merge non-conflicting changes', () => {
      const conflict = {
        localData: { id: '1', name: 'Local Change', color: 'blue', updatedAt: new Date() },
        remoteData: { id: '1', name: 'Base Name', color: 'red', updatedAt: new Date() },
        baseData: { id: '1', name: 'Base Name', color: 'blue', updatedAt: new Date() }
      };

      const result = ConflictResolver.merge(conflict);
      
      // Local changed name only, remote changed color only
      expect(result.name).toBe('Local Change'); // Local wins for conflicting field
      expect(result.color).toBe('red'); // Remote change should be applied
    });

    it('should auto-resolve based on conflict type', async () => {
      const concurrentUpdateConflict = {
        ...mockConflict,
        conflictType: 'concurrent_update'
      };

      const result = await ConflictResolver.autoResolve(concurrentUpdateConflict);
      
      // Should prefer local since it has newer timestamp
      expect(result).toEqual(mockConflict.localData);
    });

    it('should handle delete-update conflicts', async () => {
      const deleteConflict = {
        localData: null,
        remoteData: { id: '1', name: 'Updated' },
        baseData: { id: '1', name: 'Original' },
        conflictType: 'delete_update'
      };

      const result = await ConflictResolver.autoResolve(deleteConflict);
      
      // Should prefer deletion
      expect(result).toBeNull();
    });
  });

  describe('Sync Event Tracking', () => {
    it('should record sync events for repository operations', async () => {
      const user = await userRepository.create(testDataFactory.createUser({
        email: 'sync@example.com',
        name: 'Sync Test User'
      }));

      // Check that sync event was recorded
      const events = await db
        .select()
        .from(syncEvents)
        .where(eq(syncEvents.recordId, user.id));
      
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('create');
      expect(events[0].tableName).toBe('users');
      expect(events[0].operation).toBe('insert');
      expect(events[0].newData).toBeDefined();
    });

    it('should track update events with old and new data', async () => {
      const user = await userRepository.create(testDataFactory.createUser());
      
      await userRepository.update(user.id, { name: 'Updated Name' });

      const events = await db
        .select()
        .from(syncEvents)
        .where(eq(syncEvents.recordId, user.id))
        .orderBy(syncEvents.createdAt);
      
      expect(events).toHaveLength(2); // Create + Update
      
      const updateEvent = events[1];
      expect(updateEvent.eventType).toBe('update');
      expect(updateEvent.oldData).toBeDefined();
      expect(updateEvent.newData).toBeDefined();
      expect(updateEvent.oldData?.name).toBe(user.name);
      expect(updateEvent.newData?.name).toBe('Updated Name');
    });

    it('should track delete events', async () => {
      const user = await userRepository.create(testDataFactory.createUser());
      
      await userRepository.delete(user.id);

      const events = await db
        .select()
        .from(syncEvents)
        .where(eq(syncEvents.recordId, user.id))
        .orderBy(syncEvents.createdAt);
      
      expect(events).toHaveLength(2); // Create + Delete
      
      const deleteEvent = events[1];
      expect(deleteEvent.eventType).toBe('delete');
      expect(deleteEvent.oldData).toBeDefined();
      expect(deleteEvent.newData).toBeNull();
    });
  });

  describe('Performance Metrics', () => {
    it('should measure repository operation latency', async () => {
      const timer = new TestTimer();
      
      timer.start();
      await userRepository.create(testDataFactory.createUser());
      const duration = timer.stop();

      // Check that metrics were recorded
      const metrics = await db
        .select()
        .from(syncMetrics)
        .where(eq(syncMetrics.metricType, 'users_write_latency'));
      
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics[0].value).toBeGreaterThan(0);
      expect(metrics[0].value).toBeLessThan(duration + 100); // Allow some margin
    });

    it('should track error rates', async () => {
      // Force an error by trying to create user with duplicate email
      const userData = testDataFactory.createUser({ email: 'duplicate@test.com' });
      
      await userRepository.create(userData);
      
      try {
        await userRepository.create(userData); // This should fail
      } catch (error) {
        // Expected error
      }

      const errorMetrics = await db
        .select()
        .from(syncMetrics)
        .where(eq(syncMetrics.metricType, 'users_error_count'));
      
      expect(errorMetrics.length).toBeGreaterThan(0);
      expect(errorMetrics[0].value).toBe(1);
    });
  });

  describe('Sync Version Management', () => {
    it('should generate unique electric IDs', async () => {
      const user1 = await userRepository.create(testDataFactory.createUser());
      const user2 = await userRepository.create(testDataFactory.createUser());

      expect(user1.electricId).toBeDefined();
      expect(user2.electricId).toBeDefined();
      expect(user1.electricId).not.toBe(user2.electricId);
      expect(user1.electricId).toContain('users_');
    });

    it('should increment sync versions on updates', async () => {
      const user = await userRepository.create(testDataFactory.createUser());
      const originalVersion = user.syncVersion;

      const updatedUser = await userRepository.update(user.id, { name: 'New Name' });

      expect(updatedUser.syncVersion).not.toBe(originalVersion);
      expect(updatedUser.lastSyncAt).toBeDefined();
    });

    it('should track sync timestamps', async () => {
      const user = await userRepository.create(testDataFactory.createUser());
      
      expect(user.lastSyncAt).toBeDefined();
      expect(user.lastSyncAt?.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});