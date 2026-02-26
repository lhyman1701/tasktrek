# TASK-032: Share Query Hooks from packages/shared

## Status: blocked

## Dependencies

- TASK-030

## Description

Set up shared query hooks that work in both web and mobile.

## Files to Create

```
packages/shared/src/
├── hooks/
│   ├── index.ts
│   ├── useTasks.ts
│   ├── useProjects.ts
│   ├── useChat.ts
│   └── useSmartLists.ts
└── api/
    └── client.ts
```

## Implementation

```typescript
// packages/shared/src/api/client.ts
export interface ApiConfig {
  baseUrl: string;
  getToken: () => Promise<string | null>;
}

let config: ApiConfig;

export function configureApi(cfg: ApiConfig) {
  config = cfg;
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await config.getToken();

  const res = await fetch(`${config.baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers
    }
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

// packages/shared/src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../api/client';
import type { Task, CreateTask } from '../schemas';

export function useTasks(params?: TaskQueryParams) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => fetchApi<Task[]>(`/tasks`, { /* params */ })
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTask) =>
      fetchApi<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

// Mobile setup
// packages/mobile/src/lib/api.ts
import { configureApi } from '@taskflow/shared';
import * as SecureStore from 'expo-secure-store';

configureApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL!,
  getToken: () => SecureStore.getItemAsync('apiToken')
});
```

## Acceptance Criteria

1. [ ] Shared hooks compile for both platforms
2. [ ] API client is configurable
3. [ ] Mobile uses SecureStore for token
4. [ ] Web uses localStorage
5. [ ] Query cache works
