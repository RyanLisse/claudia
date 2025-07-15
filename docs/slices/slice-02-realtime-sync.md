# SLICE 02: Real-time Sync with ElectricSQL and Neon

## METADATA
- **Complexity**: 🟡 Medium
- **Effort**: 6 story points
- **Priority**: High
- **Dependencies**: Slice 01
- **Team**: Full Stack

## USER STORY
**As a** developer
**I want** real-time data synchronization
**So that** multiple users can collaborate seamlessly

## TECHNICAL BREAKDOWN

### 🎨 Frontend Tasks
- [ ] Integrate ElectricSQL React hooks
- [ ] Implement optimistic updates with TanStack Query
- [ ] Create sync status indicators
- [ ] Build conflict resolution UI

### ⚙️ Backend Tasks
- [ ] Configure ElectricSQL with Neon
- [ ] Set up shape definitions
- [ ] Implement auth for shapes
- [ ] Create sync monitoring

## CODE EXAMPLES

```typescript
// packages/db/electric.ts
import { ElectricClient, ShapeStream } from '@electric-sql/client';
import { z } from 'zod';

export class ElectricSync {
  private client: ElectricClient;
  
  constructor(private baseUrl: string) {
    this.client = new ElectricClient({
      url: baseUrl,
      headers: {
        'Authorization': `Bearer ${process.env.ELECTRIC_TOKEN}`
      }
    });
  }

  async syncShape<T extends z.ZodType>(
    table: string,
    schema: T,
    where?: string
  ): Promise<ShapeStream<z.infer<T>>> {
    const stream = await this.client.stream({
      table,
      where,
      columns: Object.keys(schema.shape)
    });

    return {
      ...stream,
      subscribe: (callback: (data: z.infer<T>[]) => void) => {
        return stream.subscribe((rawData) => {
          const validated = z.array(schema).parse(rawData);
          callback(validated);
        });
      }
    };
  }
}
```

```typescript
// hooks/useRealtimeSync.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useElectricShape } from '@electric-sql/react';
import { z } from 'zod';

export function useRealtimeData<T extends z.ZodType>(
  key: string[],
  table: string,
  schema: T,
  where?: string
) {
  const queryClient = useQueryClient();
  
  // Electric sync
  const { data: electricData } = useElectricShape({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: { table, where },
    parser: (data) => z.array(schema).parse(data)
  });

  // TanStack Query for local state
  const query = useQuery({
    queryKey: [...key, where],
    queryFn: async () => {
      const response = await fetch(`/api/${table}?${where}`);
      const data = await response.json();
      return schema.array().parse(data);
    },
    initialData: electricData,
    staleTime: Infinity // Let Electric handle updates
  });

  // Optimistic updates
  const mutation = useMutation({
    mutationFn: async (updates: Partial<z.infer<T>>) => {
      const response = await fetch(`/api/${table}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      return response.json();
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      
      queryClient.setQueryData(key, (old: any[]) => 
        old.map(item => 
          item.id === updates.id ? { ...item, ...updates } : item
        )
      );
      
      return { previous };
    },
    onError: (err, updates, context) => {
      queryClient.setQueryData(key, context?.previous);
    }
  });

  return {
    data: query.data ?? electricData ?? [],
    isLoading: query.isLoading,
    mutate: mutation.mutate,
    isOptimistic: mutation.isPending
  };
}
```

```typescript
// tests/integration/sync.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestClient } from '../utils/test-client';
import { ElectricSync } from '@db/electric';
import { insertSessionSchema } from '@db/schema';

describe('ElectricSQL Sync Integration', () => {
  let client1: any;
  let client2: any;
  let electricSync: ElectricSync;

  beforeAll(async () => {
    client1 = await createTestClient();
    client2 = await createTestClient();
    electricSync = new ElectricSync(process.env.ELECTRIC_URL!);
  });

  afterAll(async () => {
    await client1.close();
    await client2.close();
  });

  it('should sync data between clients in real-time', async () => {
    // Client 1 creates a session
    const session = await client1.post('/api/sessions', {
      name: 'Test Session',
      userId: 'user-123'
    });

    // Client 2 subscribes to sessions
    const updates: any[] = [];
    const stream = await electricSync.syncShape(
      'ai_sessions',
      insertSessionSchema,
      `user_id = 'user-123'`
    );

    const unsubscribe = stream.subscribe((data) => {
      updates.push(data);
    });

    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 100));

    // Assert
    expect(updates).toHaveLength(1);
    expect(updates[0]).toContainEqual(
      expect.objectContaining({
        id: session.id,
        name: 'Test Session'
      })
    );

    unsubscribe();
  });
});
```

## ACCEPTANCE CRITERIA
1. Real-time sync works with < 100ms latency
2. Offline changes sync when reconnected
3. Conflict resolution handles concurrent edits
4. Shape authorization prevents unauthorized access
5. Sync monitoring dashboard functional

## DEFINITION OF DONE
- [ ] ElectricSQL integrated with Neon
- [ ] React hooks created and tested
- [ ] Optimistic updates working
- [ ] Integration tests passing
- [ ] Performance benchmarks met