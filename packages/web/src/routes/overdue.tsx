import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@/components/tasks/TaskList';

export const Route = createFileRoute('/overdue')({
  component: OverduePage
});

function OverduePage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 text-red-500">Overdue</h1>
        <TaskList filter="overdue" />
      </div>
    </div>
  );
}
