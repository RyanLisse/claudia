# Claudia Database & Sync Architecture

A comprehensive database and real-time synchronization system built with Neon PostgreSQL, Drizzle ORM, and ElectricSQL.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│  Database API   │───▶│ Neon PostgreSQL │
│     Layer       │    │   (Drizzle)     │    │   (Primary DB)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ElectricSQL   │───▶│  Sync Monitor   │───▶│ Conflict Resolver│
│  (Real-time)    │    │  (Monitoring)   │    │  (Auto-resolve) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Database Schema

### Core Tables

#### Users
- **Purpose**: User accounts and preferences
- **Key Features**: Theme preferences, activity tracking, sync metadata
- **Relations**: Owns projects, creates agents, participates in sessions

#### Projects
- **Purpose**: Development project management
- **Key Features**: Git integration, build settings, collaboration
- **Relations**: Belongs to user, contains agents and sessions

#### Agents
- **Purpose**: AI agent configurations and performance tracking
- **Key Features**: Type-based specialization, metrics, capability definitions
- **Relations**: Created by user, associated with project

#### Sessions
- **Purpose**: Conversation/interaction sessions
- **Key Features**: Context preservation, token tracking, duration metrics
- **Relations**: User sessions, optionally linked to project/agent

#### Messages
- **Purpose**: Individual conversation messages
- **Key Features**: Role-based typing, tool calls, response metadata
- **Relations**: Belongs to session, supports threading

#### Memory
- **Purpose**: Persistent knowledge and context storage
- **Key Features**: Type categorization, importance scoring, expiration
- **Relations**: User/project/session scoped, full-text search

### Sync Tables

#### Sync Events
- **Purpose**: Track all database changes for synchronization
- **Key Features**: Operation logging, conflict detection, retry logic

#### Sync Conflicts
- **Purpose**: Handle concurrent modification conflicts
- **Key Features**: Resolution strategies, manual intervention support

#### Sync Metrics
- **Purpose**: Performance and health monitoring
- **Key Features**: Latency tracking, bandwidth usage, error rates

## ⚡ Real-time Synchronization

### ElectricSQL Integration

```typescript
import { syncManager } from './electric';

// Initialize sync for real-time updates
await syncManager.initialize();

// Set up table subscriptions
await syncManager.syncTable('users');
await syncManager.syncTable('projects', { 
  where: { ownerId: currentUserId } 
});
```

### Conflict Resolution

```typescript
import { ConflictResolver } from './electric';

// Automatic resolution strategies
const resolved = await ConflictResolver.autoResolve(conflict);

// Manual resolution
const merged = ConflictResolver.merge(conflict);
const localWins = ConflictResolver.localWins(conflict);
const remoteWins = ConflictResolver.remoteWins(conflict);
```

## 📊 Monitoring & Metrics

### Health Monitoring

```typescript
import { syncMonitor } from './sync-monitor';

// Get current sync status
const status = await syncMonitor.getSyncStatus();
console.log({
  isOnline: status.isOnline,
  pendingEvents: status.pendingEvents,
  conflicts: status.conflicts,
  latency: status.latency
});

// Monitor health in real-time
syncMonitor.subscribe((status) => {
  if (!status.isOnline) {
    console.warn('Sync service offline!');
  }
});
```

### Performance Metrics

```typescript
// Record custom metrics
await syncMonitor.recordMetric('api_response_time', 150);
await syncMonitor.recordMetric('user_action_count', 1);

// Get detailed analytics
const metrics = await syncMonitor.getDetailedMetrics(24); // Last 24 hours
```

## 🗃️ Repository Pattern

### Type-safe Data Access

```typescript
import { userRepository, projectRepository } from './repositories';

// Create with full type safety
const user = await userRepository.create({
  email: 'user@example.com',
  name: 'John Doe',
  preferences: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: true,
      push: false,
      desktop: true
    }
  }
});

// Query with advanced filtering
const activeProjects = await projectRepository.findActive();
const searchResults = await projectRepository.search('react', userId);
```

### Automatic Sync Tracking

All repository operations automatically:
- Generate unique ElectricSQL IDs
- Record sync events
- Track performance metrics
- Handle version management

## 🔧 Configuration

### Environment Variables

```bash
# Primary database
DATABASE_URL="postgresql://user:pass@host:5432/claudia"

# ElectricSQL service
ELECTRIC_URL="ws://localhost:5133"

# Test database
TEST_DATABASE_URL="postgresql://test:test@localhost:5432/claudia_test"

# Client identification
CLIENT_ID="claudia-server"
CURRENT_USER_ID="user-uuid"
```

### Service Configuration

```typescript
import { DatabaseService } from './service';

const dbService = new DatabaseService({
  enableSync: true,
  enableMonitoring: true,
  monitoringInterval: 5000,
  autoResolveConflicts: true,
  syncBatchSize: 100,
  metricsRetentionDays: 30
});

await dbService.initialize();
```

## 🧪 Testing

### Running Tests

```bash
# Run all database tests
bun test src/db/tests/

# Run specific test suites
bun test src/db/tests/repositories.test.ts
bun test src/db/tests/sync.test.ts
```

### Test Database Setup

Tests use a separate PostgreSQL database with:
- Isolated test data
- Automatic cleanup between tests
- Mock sync events
- Performance timing utilities

## 🚀 Database Commands

```bash
# Generate migrations
bun run db:generate

# Apply migrations
bun run db:migrate

# Push schema changes
bun run db:push

# Open Drizzle Studio
bun run db:studio
```

## 📈 Performance Optimizations

### Indexing Strategy
- **Primary Keys**: UUID with default generation
- **Foreign Keys**: Proper referential integrity
- **Search Fields**: Full-text search indexes
- **Sync Fields**: Optimized for ElectricSQL queries
- **JSONB Fields**: GIN indexes for complex queries

### Query Optimization
- **Batch Operations**: Repository pattern supports bulk operations
- **Lazy Loading**: Relations loaded on demand
- **Caching**: Automatic query result caching
- **Connection Pooling**: Optimized connection management

### Sync Optimization
- **Shape Subscriptions**: Only sync relevant data subsets
- **Batch Conflicts**: Resolve multiple conflicts efficiently
- **Incremental Sync**: Only transfer changed data
- **Compression**: Minimize bandwidth usage

## 🔒 Security Features

### Data Protection
- **SQL Injection**: Parameterized queries via Drizzle ORM
- **Access Control**: Repository-level permission checks
- **Audit Trail**: Complete sync event logging
- **Encryption**: Support for encrypted field storage

### Sync Security
- **Client Authentication**: Secure WebSocket connections
- **Data Validation**: Schema validation on all operations
- **Conflict Prevention**: Optimistic locking strategies
- **Rate Limiting**: Configurable sync frequency limits

## 🛠️ Maintenance

### Regular Tasks
- **Cleanup**: Automatic old data removal
- **Metrics**: Performance monitoring and alerting
- **Backup**: Scheduled database backups
- **Health Checks**: Continuous system monitoring

### Troubleshooting

```typescript
// Check system health
const health = await dbService.healthCheck();
if (health.status === 'critical') {
  console.error('Database issues:', health.details);
}

// Force sync resolution
await dbService.forceSyncAll();

// Manual conflict resolution
const conflicts = await dbService.getConflicts();
for (const conflict of conflicts) {
  await dbService.resolveConflict(conflict.id, 'merge');
}
```

## 📚 API Reference

### DatabaseService
- `initialize()` - Start all database services
- `shutdown()` - Graceful shutdown
- `healthCheck()` - System health status
- `getMetrics()` - Performance analytics
- `cleanup()` - Maintenance operations

### Repositories
- `create(data)` - Insert new record
- `findById(id)` - Get by primary key
- `update(id, data)` - Modify existing record
- `delete(id)` - Remove record
- `findMany(where, limit, offset)` - Query multiple records

### Sync Manager
- `initialize()` - Start sync service
- `syncTable(name, shape)` - Subscribe to table changes
- `getConflicts()` - List unresolved conflicts
- `resolveConflict(id, strategy)` - Resolve specific conflict

## 🎯 Future Enhancements

- **Multi-tenant Support**: Isolated data per organization
- **Advanced Analytics**: ML-powered performance insights
- **Cross-Region Sync**: Global data distribution
- **Schema Evolution**: Automatic migration generation
- **Real-time Collaboration**: Operational transformation support

---

Built with ❤️ for the Claudia AI Assistant Platform