# TASK-021: Build Three-Panel Layout

## Status: blocked

## Dependencies

- TASK-018, TASK-019

## Description

Create responsive three-panel layout (sidebar, list, detail).

## Implementation

```typescript
// components/Layout.tsx
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  return (
    <div className="flex h-screen bg-surface dark:bg-surface-dark">
      {/* Sidebar */}
      <aside
        className={cn(
          'w-64 border-r border-gray-200 dark:border-gray-700',
          'transition-all duration-200',
          !sidebarOpen && '-ml-64'
        )}
      >
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Task list */}
        <div
          className={cn(
            'flex-1 overflow-y-auto',
            detailOpen && 'hidden lg:block lg:w-1/2'
          )}
        >
          {children}
        </div>

        {/* Detail panel */}
        {detailOpen && selectedTaskId && (
          <div className="w-full lg:w-1/2 border-l border-gray-200 dark:border-gray-700">
            <TaskDetail
              taskId={selectedTaskId}
              onClose={() => setDetailOpen(false)}
            />
          </div>
        )}
      </main>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Three-panel layout renders
2. [ ] Sidebar collapses on mobile
3. [ ] Detail panel slides in
4. [ ] Responsive breakpoints work
5. [ ] Dark mode supported
