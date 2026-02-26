# TASK-025: Build Task Detail Panel

## Status: blocked

## Dependencies

- TASK-023

## Description

Build task detail panel for viewing and editing tasks.

## Implementation

```typescript
// components/TaskDetail.tsx
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks';
import { formatDueDate } from '@/lib/dates';

interface TaskDetailProps {
  taskId: string;
  onClose: () => void;
}

export function TaskDetail({ taskId, onClose }: TaskDetailProps) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (isLoading) return <DetailSkeleton />;
  if (!task) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Task Details</h2>
        <button onClick={onClose}>
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Title */}
        <EditableField
          value={task.content}
          onSave={(content) => updateTask.mutate({ id: taskId, content })}
          className="text-xl font-medium"
        />

        {/* Description */}
        <div>
          <label className="text-sm text-gray-500">Description</label>
          <EditableTextarea
            value={task.description || ''}
            onSave={(description) => updateTask.mutate({ id: taskId, description })}
            placeholder="Add description..."
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm text-gray-500">Due Date</label>
          <DatePicker
            value={task.dueDate}
            onChange={(dueDate) => updateTask.mutate({ id: taskId, dueDate })}
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm text-gray-500">Priority</label>
          <PrioritySelect
            value={task.priority}
            onChange={(priority) => updateTask.mutate({ id: taskId, priority })}
          />
        </div>

        {/* Project */}
        <div>
          <label className="text-sm text-gray-500">Project</label>
          <ProjectSelect
            value={task.projectId}
            onChange={(projectId) => updateTask.mutate({ id: taskId, projectId })}
          />
        </div>

        {/* Labels */}
        <div>
          <label className="text-sm text-gray-500">Labels</label>
          <LabelMultiSelect
            value={task.labels?.map(l => l.id) || []}
            onChange={(labels) => updateTask.mutate({ id: taskId, labels })}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-between text-sm text-gray-500">
        <span>Created {formatDate(task.createdAt)}</span>
        <button
          onClick={() => {
            deleteTask.mutate(taskId);
            onClose();
          }}
          className="text-red-600 hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Task details render
2. [ ] Inline editing works
3. [ ] Date picker works
4. [ ] Priority select works
5. [ ] Project select works
6. [ ] Labels multi-select
7. [ ] Delete confirmation
8. [ ] Close button works
