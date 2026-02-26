import { createFileRoute } from '@tanstack/react-router';
import { TaskList } from '@/components/tasks/TaskList';

export const Route = createFileRoute('/inbox')({
  component: InboxPage
});

function InboxPage() {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Inbox</h1>
        <TaskList filter="inbox" />
      </div>
    </div>
  );
}
