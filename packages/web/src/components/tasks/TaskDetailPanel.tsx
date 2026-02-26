import { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Flag,
  Hash,
  Tag,
  Trash2,
  Loader2
} from 'lucide-react';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useProjects } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatDate, getPriorityColor, dateToInputValue, dateToNoonUTC } from '@/lib/utils';
import { getColorHex } from '@/lib/colors';

export function TaskDetailPanel() {
  const { selectedTaskId, setSelectedTask } = useUIStore();
  const { data: task, isLoading } = useTask(selectedTaskId ?? undefined);
  const { data: projects } = useProjects();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (task) {
      setContent(task.content);
      setDescription(task.description || '');
    }
  }, [task]);

  const handleClose = () => {
    setSelectedTask(null);
  };

  const handleContentBlur = () => {
    if (task && content !== task.content) {
      updateTask.mutate({ id: task.id, data: { content } });
    }
  };

  const handleDescriptionBlur = () => {
    if (task && description !== (task.description || '')) {
      updateTask.mutate({ id: task.id, data: { description: description || undefined } });
    }
  };

  const handlePriorityChange = (priority: number) => {
    if (task) {
      const priorityString = `p${priority}` as 'p1' | 'p2' | 'p3' | 'p4';
      updateTask.mutate({ id: task.id, data: { priority: priorityString } });
    }
  };

  const handleProjectChange = (projectId: string | null) => {
    if (task) {
      updateTask.mutate({ id: task.id, data: { projectId } });
    }
  };

  const handleDelete = () => {
    if (task && confirm('Delete this task?')) {
      deleteTask.mutate(task.id);
      setSelectedTask(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500">
        Select a task to view details
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-lg font-semibold">Task Details</h2>
        <button
          onClick={handleClose}
          className="rounded-lg p-1 hover:bg-surface-100 dark:hover:bg-surface-700"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleContentBlur}
          className="w-full text-lg font-medium bg-transparent border-none focus:outline-none focus:ring-0"
          placeholder="Task name"
        />

        {/* Description */}
        <div>
          <label className="text-sm font-medium text-surface-500 mb-1 block">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            className="input min-h-[100px] resize-none"
            placeholder="Add a description..."
          />
        </div>

        {/* Due Date */}
        <div>
          <label className="text-sm font-medium text-surface-500 mb-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Due Date
          </label>
          <input
            type="date"
            value={dateToInputValue(task.dueDate)}
            onChange={(e) => {
              const date = e.target.value ? dateToNoonUTC(e.target.value) : null;
              updateTask.mutate({ id: task.id, data: { dueDate: date } });
            }}
            className="input"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-sm font-medium text-surface-500 mb-1 flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Priority
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  task.priority === p
                    ? 'bg-surface-900 text-white dark:bg-white dark:text-surface-900'
                    : 'bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600',
                  getPriorityColor(p)
                )}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>

        {/* Project */}
        <div>
          <label className="text-sm font-medium text-surface-500 mb-1 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Project
          </label>
          <select
            value={task.projectId || ''}
            onChange={(e) => handleProjectChange(e.target.value || null)}
            className="input"
          >
            <option value="">No project</option>
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Labels */}
        {task.labels && task.labels.length > 0 && (
          <div>
            <label className="text-sm font-medium text-surface-500 mb-1 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Labels
            </label>
            <div className="flex flex-wrap gap-2">
              {task.labels.map((label) => {
                const hex = getColorHex(label.color);
                return (
                  <span
                    key={label.id}
                    className="rounded-full px-3 py-1 text-sm"
                    style={{ backgroundColor: `${hex}20`, color: hex }}
                  >
                    {label.name}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t text-xs text-surface-400 space-y-1">
          <p>Created: {formatDate(task.createdAt)}</p>
          <p>Updated: {formatDate(task.updatedAt)}</p>
          {task.completedAt && <p>Completed: {formatDate(task.completedAt)}</p>}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <button
          onClick={handleDelete}
          className="btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
        >
          <Trash2 className="h-4 w-4" />
          Delete Task
        </button>
      </div>
    </div>
  );
}
