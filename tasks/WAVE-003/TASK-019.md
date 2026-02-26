# TASK-019: Set Up TanStack Router

## Status: blocked

## Dependencies

- TASK-017

## Description

Configure TanStack Router for type-safe routing.

## Files to Create

```
packages/web/src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx
│   ├── inbox.tsx
│   ├── today.tsx
│   ├── upcoming.tsx
│   ├── project.$projectId.tsx
│   └── label.$labelId.tsx
└── routeTree.gen.ts
```

## Implementation

```typescript
// routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Layout } from '@/components/Layout';

export const Route = createRootRoute({
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  )
});

// routes/index.tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/inbox' });
  }
});

// routes/today.tsx
import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@/components/TaskList';
import { useSmartList } from '@/hooks/useSmartList';

export const Route = createFileRoute('/today')({
  component: TodayPage
});

function TodayPage() {
  const { data, isLoading } = useSmartList('today');
  return <TaskList tasks={data?.tasks} isLoading={isLoading} />;
}
```

## Acceptance Criteria

1. [ ] File-based routing works
2. [ ] Type-safe route params
3. [ ] Redirects work
4. [ ] Route guards (auth) work
5. [ ] Active route highlighting
