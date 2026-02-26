# TASK-028: Add Command Palette + Keyboard Shortcuts

## Status: blocked

## Dependencies

- TASK-021

## Description

Add command palette (Cmd+K) and global keyboard shortcuts.

## Implementation

```typescript
// components/CommandPalette.tsx
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useNavigate } from '@tanstack/react-router';
import { useProjects, useLabels, useSearchTasks } from '@/hooks';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const { data: labels } = useLabels();
  const { data: tasks } = useSearchTasks(search);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20"
    >
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder="Search tasks, projects, or run commands..."
          className="w-full px-4 py-3 border-b outline-none"
        />

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty>No results found.</Command.Empty>

          {/* Quick Actions */}
          <Command.Group heading="Actions">
            <Command.Item onSelect={() => { /* trigger quick add */ }}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Task
            </Command.Item>
            <Command.Item onSelect={() => navigate('/inbox')}>
              <InboxIcon className="w-4 h-4 mr-2" />
              Go to Inbox
            </Command.Item>
            <Command.Item onSelect={() => navigate('/today')}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Go to Today
            </Command.Item>
          </Command.Group>

          {/* Tasks */}
          {tasks?.length > 0 && (
            <Command.Group heading="Tasks">
              {tasks.map(task => (
                <Command.Item
                  key={task.id}
                  onSelect={() => {
                    navigate(`/task/${task.id}`);
                    setOpen(false);
                  }}
                >
                  <CheckIcon className="w-4 h-4 mr-2" />
                  {task.content}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Projects */}
          <Command.Group heading="Projects">
            {projects?.map(project => (
              <Command.Item
                key={project.id}
                onSelect={() => {
                  navigate(`/project/${project.id}`);
                  setOpen(false);
                }}
              >
                <FolderIcon className="w-4 h-4 mr-2" />
                {project.name}
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>

        <div className="p-2 border-t text-xs text-gray-500 flex gap-4">
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>esc Close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}

// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.key === 'n' && !isInputFocused()) {
        e.preventDefault();
        // Focus quick add
      }
      if (e.key === 'g' && !isInputFocused()) {
        // Wait for next key
        waitForKey(next => {
          if (next === 'i') navigate('/inbox');
          if (next === 't') navigate('/today');
          if (next === 'u') navigate('/upcoming');
        });
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+K | Open command palette |
| n | New task (quick add) |
| g i | Go to Inbox |
| g t | Go to Today |
| g u | Go to Upcoming |
| / | Focus search |
| ? | Show shortcuts help |

## Acceptance Criteria

1. [ ] Cmd+K opens palette
2. [ ] Search filters results
3. [ ] Keyboard navigation
4. [ ] Actions execute correctly
5. [ ] Global shortcuts work
6. [ ] Shortcuts disabled when typing
