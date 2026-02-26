# TASK-020: Set Up TanStack Query + API Client

## Status: blocked

## Dependencies

- TASK-017

## Description

Configure TanStack Query for data fetching and create API client.

## Files to Create

```
packages/web/src/
├── lib/
│   ├── api.ts
│   └── queryClient.ts
└── hooks/
    ├── useTasks.ts
    ├── useProjects.ts
    ├── useLabels.ts
    └── useSmartList.ts
```

## Implementation

```typescript
// lib/api.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem('apiToken');

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'API Error');
  }

  return res.json();
}

export const api = {
  tasks: {
    list: (params?: TaskQueryParams) =>
      fetchApi<Task[]>(`/tasks?${new URLSearchParams(params)}`),
    get: (id: string) => fetchApi<Task>(`/tasks/${id}`),
    create: (data: CreateTask) =>
      fetchApi<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id: string, data: UpdateTask) =>
      fetchApi<Task>(`/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    delete: (id: string) =>
      fetchApi<void>(`/tasks/${id}`, { method: 'DELETE' }),
    complete: (id: string) =>
      fetchApi<Task>(`/tasks/${id}/complete`, { method: 'POST' })
  },
  smartLists: {
    get: (type: SmartListType) => fetchApi<SmartListResult>(`/smart-lists/${type}`),
    counts: () => fetchApi<SmartListCounts>('/smart-lists/counts')
  },
  ai: {
    parse: (text: string) =>
      fetchApi<ParsedTask>('/ai/parse', {
        method: 'POST',
        body: JSON.stringify({ text })
      }),
    quickAdd: (text: string) =>
      fetchApi<QuickAddResult>('/ai/quick-add', {
        method: 'POST',
        body: JSON.stringify({ text, createLabels: true })
      })
  }
};

// hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useTasks(params?: TaskQueryParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => api.tasks.list(params)
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.tasks.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['smart-lists'] });
    }
  });
}
```

## Acceptance Criteria

1. [ ] API client with auth headers
2. [ ] Query hooks for all entities
3. [ ] Mutations with cache invalidation
4. [ ] Error handling
5. [ ] Loading states
