import { useSmartList } from '@/hooks/useSmartLists';
import { TaskItem } from './TaskItem';
import { Loader2 } from 'lucide-react';

interface TaskListProps {
  filter: string;
  projectId?: string;
}

export function TaskList({ filter, projectId }: TaskListProps) {
  const params = projectId ? { projectId } : undefined;
  const { data, isLoading, error } = useSmartList(filter, params);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
        Failed to load tasks: {error.message}
      </div>
    );
  }

  if (!data?.tasks.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-surface-500">
        <div className="text-6xl mb-4">✨</div>
        <p className="text-lg font-medium">All clear!</p>
        <p className="text-sm">No tasks here. Enjoy your day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {data.tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
      {data.hasMore && (
        <div className="pt-4 text-center text-sm text-surface-500">
          Showing {data.tasks.length} of {data.total} tasks
        </div>
      )}
    </div>
  );
}
