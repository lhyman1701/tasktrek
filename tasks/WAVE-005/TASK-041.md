# TASK-041: Implement Offline Queue

## Status: blocked

## Dependencies

- TASK-040

## Description

Implement offline support with operation queue that syncs when online.

## Architecture

```
┌─────────────────────────────────────────┐
│                  App                     │
├─────────────────────────────────────────┤
│  Optimistic Updates (TanStack Query)    │
├─────────────────────────────────────────┤
│  Offline Queue (MMKV/AsyncStorage)      │
├─────────────────────────────────────────┤
│  Network Monitor (NetInfo)              │
├─────────────────────────────────────────┤
│  Sync Service                           │
└─────────────────────────────────────────┘
```

## Implementation

### Offline Queue

```typescript
// lib/offlineQueue.ts
import { MMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'project' | 'label';
  data: any;
  timestamp: number;
  retries: number;
}

const storage = new MMKV({ id: 'offline-queue' });

export const offlineQueue = {
  add(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>) {
    const queue = this.getAll();
    const op: QueuedOperation = {
      ...operation,
      id: generateId(),
      timestamp: Date.now(),
      retries: 0
    };
    queue.push(op);
    storage.set('queue', JSON.stringify(queue));
    return op;
  },

  getAll(): QueuedOperation[] {
    const data = storage.getString('queue');
    return data ? JSON.parse(data) : [];
  },

  remove(id: string) {
    const queue = this.getAll().filter(op => op.id !== id);
    storage.set('queue', JSON.stringify(queue));
  },

  incrementRetry(id: string) {
    const queue = this.getAll().map(op =>
      op.id === id ? { ...op, retries: op.retries + 1 } : op
    );
    storage.set('queue', JSON.stringify(queue));
  },

  clear() {
    storage.delete('queue');
  }
};
```

### Sync Service

```typescript
// lib/syncService.ts
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from './offlineQueue';
import { api } from '@taskflow/shared';

class SyncService {
  private isSyncing = false;
  private unsubscribe: (() => void) | null = null;

  start() {
    this.unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.sync();
      }
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  async sync() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    const queue = offlineQueue.getAll();

    for (const operation of queue) {
      if (operation.retries >= 3) {
        // Too many retries, move to dead letter
        offlineQueue.remove(operation.id);
        continue;
      }

      try {
        await this.executeOperation(operation);
        offlineQueue.remove(operation.id);
      } catch (error) {
        offlineQueue.incrementRetry(operation.id);
        console.error('Sync failed:', error);
      }
    }

    this.isSyncing = false;
  }

  private async executeOperation(op: QueuedOperation) {
    const handlers: Record<string, Record<string, Function>> = {
      task: {
        create: (data: any) => api.tasks.create(data),
        update: (data: any) => api.tasks.update(data.id, data),
        delete: (data: any) => api.tasks.delete(data.id)
      },
      project: {
        create: (data: any) => api.projects.create(data),
        update: (data: any) => api.projects.update(data.id, data),
        delete: (data: any) => api.projects.delete(data.id)
      }
    };

    const handler = handlers[op.entity]?.[op.type];
    if (handler) {
      await handler(op.data);
    }
  }
}

export const syncService = new SyncService();
```

### Optimistic Mutation Hook

```typescript
// hooks/useOfflineMutation.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { offlineQueue } from '@/lib/offlineQueue';

export function useOfflineCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTask) => {
      const netState = await NetInfo.fetch();

      if (netState.isConnected) {
        return api.tasks.create(data);
      } else {
        // Queue for later
        offlineQueue.add({
          type: 'create',
          entity: 'task',
          data
        });

        // Return optimistic result
        return {
          ...data,
          id: `temp-${Date.now()}`,
          isCompleted: false,
          createdAt: new Date().toISOString()
        };
      }
    },
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previous = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: Task[]) => [
        { ...newTask, id: `optimistic-${Date.now()}` },
        ...(old || [])
      ]);

      return { previous };
    },
    onError: (err, newTask, context) => {
      queryClient.setQueryData(['tasks'], context?.previous);
    }
  });
}
```

## Acceptance Criteria

1. [ ] Operations queue when offline
2. [ ] Queue persists across app restarts
3. [ ] Auto-sync when back online
4. [ ] Optimistic UI updates
5. [ ] Failed operations retry
6. [ ] Conflict resolution (server wins)
7. [ ] Offline indicator shown
