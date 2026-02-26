# TASK-023: Build Task List Component

## Status: blocked

## Dependencies

- TASK-020, TASK-021

## Description

Build task list with checkboxes, priority indicators, and drag-and-drop.

## Implementation

```typescript
// components/TaskList.tsx
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick: (id: string) => void;
  onTaskComplete: (id: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}

export function TaskList({
  tasks,
  isLoading,
  onTaskClick,
  onTaskComplete,
  onReorder
}: TaskListProps) {
  if (isLoading) return <TaskListSkeleton />;
  if (!tasks?.length) return <EmptyState />;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={({ active, over }) => {
        if (over && active.id !== over.id) {
          onReorder(active.id as string, over.id as string);
        }
      }}
    >
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="divide-y divide-gray-100 dark:divide-gray-800">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task.id)}
              onComplete={() => onTaskComplete(task.id)}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

// components/TaskItem.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PriorityIndicator } from './PriorityIndicator';
import { formatDueDate } from '@/lib/dates';

export function TaskItem({ task, onClick, onComplete }: TaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      <button {...listeners} className="cursor-grab mr-2">
        <GripIcon className="w-4 h-4 text-gray-400" />
      </button>

      <Checkbox
        checked={task.isCompleted}
        onChange={() => onComplete()}
        className="mr-3"
      />

      <PriorityIndicator priority={task.priority} className="mr-2" />

      <div className="flex-1 cursor-pointer" onClick={onClick}>
        <p className={cn(task.isCompleted && 'line-through text-gray-400')}>
          {task.content}
        </p>
        <div className="flex gap-2 mt-1">
          {task.dueDate && (
            <span className="text-xs text-gray-500">
              {formatDueDate(task.dueDate)}
            </span>
          )}
          {task.labels?.map(label => (
            <span
              key={label.id}
              className="text-xs px-1 rounded"
              style={{ backgroundColor: label.color + '20', color: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      </div>
    </li>
  );
}
```

## Acceptance Criteria

1. [ ] Tasks render with content
2. [ ] Checkbox toggles completion
3. [ ] Priority indicator shows
4. [ ] Due date formatted
5. [ ] Labels display
6. [ ] Drag-and-drop reorders
7. [ ] Loading skeleton
8. [ ] Empty state
