import { createFileRoute } from '@tanstack/react-router';
import { useProject } from '@/hooks/useProjects';
import { TaskList } from '@/components/tasks/TaskList';
import { Loader2, Hash } from 'lucide-react';

export const Route = createFileRoute('/projects/$projectId')({
  component: ProjectPage
});

function ProjectPage() {
  const { projectId } = Route.useParams();
  const { data: project, isLoading, error } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full text-surface-500">
        Project not found
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Hash className="h-6 w-6" style={{ color: project.color }} />
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
        <TaskList filter="all" projectId={projectId} />
      </div>
    </div>
  );
}
