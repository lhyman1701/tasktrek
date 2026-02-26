import { Circle, CheckCircle2, Calendar, Flag, Hash } from 'lucide-react';
import { Task } from '@/lib/api';
import { useCompleteTask, useReopenTask } from '@/hooks/useTasks';
import { useUIStore } from '@/stores/uiStore';
import { cn, formatRelativeDate, getPriorityColor, isDateOverdue } from '@/lib/utils';
import { getColorHex } from '@/lib/colors';

interface TaskItemProps {
  task: Task;
}

export function TaskItem({ task }: TaskItemProps) {
  const { selectedTaskId, setSelectedTask } = useUIStore();
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();

  const isSelected = selectedTaskId === task.id;
  const isOverdue = task.dueDate && isDateOverdue(task.dueDate) && !task.isCompleted;

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.isCompleted) {
      reopenTask.mutate(task.id);
    } else {
      completeTask.mutate(task.id);
    }
  };

  const handleClick = () => {
    setSelectedTask(isSelected ? null : task.id);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer',
        isSelected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-transparent hover:bg-surface-50 dark:hover:bg-surface-800',
        task.isCompleted && 'opacity-60'
      )}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          'mt-0.5 flex-shrink-0 transition-colors',
          task.isCompleted
            ? 'text-green-500'
            : getPriorityColor(task.priority)
        )}
      >
        {task.isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            task.isCompleted && 'line-through text-surface-500'
          )}
        >
          {task.content}
        </p>

        {/* Meta info */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-surface-500">
          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                'flex items-center gap-1',
                isOverdue && 'text-red-500'
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatRelativeDate(task.dueDate)}
            </span>
          )}

          {/* Project */}
          {task.project && (
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" style={{ color: getColorHex(task.project.color) }} />
              {task.project.name}
            </span>
          )}

          {/* Priority flag */}
          {task.priority < 4 && (
            <span className={cn('flex items-center gap-1', getPriorityColor(task.priority))}>
              <Flag className="h-3 w-3" />
              P{task.priority}
            </span>
          )}

          {/* Labels */}
          {task.labels?.map((label) => {
            const hex = getColorHex(label.color);
            return (
              <span
                key={label.id}
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: `${hex}20`, color: hex }}
              >
                {label.name}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
