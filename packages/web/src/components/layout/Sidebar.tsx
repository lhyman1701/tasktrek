import { Link, useRouterState } from '@tanstack/react-router';
import {
  Inbox,
  Calendar,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Hash,
  Plus,
  Settings,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Pencil
} from 'lucide-react';
import { useState } from 'react';
import { useSmartListCounts } from '@/hooks/useSmartLists';
import { useProjects } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { getColorHex } from '@/lib/colors';

export function Sidebar() {
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const { data: counts } = useSmartListCounts();
  const { data: projects } = useProjects();
  const { toggleChat, openProjectModal } = useUIStore();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const smartLists = [
    { path: '/', icon: Calendar, label: 'Today', count: counts?.today },
    { path: '/inbox', icon: Inbox, label: 'Inbox', count: counts?.inbox },
    { path: '/upcoming', icon: CalendarDays, label: 'Upcoming', count: counts?.upcoming },
    { path: '/overdue', icon: AlertCircle, label: 'Overdue', count: counts?.overdue, className: 'text-red-500' },
    { path: '/completed', icon: CheckCircle2, label: 'Completed' }
  ];

  return (
    <aside className="flex w-64 flex-col border-r bg-surface-50 dark:bg-surface-900">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
          T
        </div>
        <span className="text-lg font-semibold">TaskFlow</span>
      </div>

      {/* Smart Lists */}
      <nav className="flex-1 overflow-auto p-2">
        <div className="space-y-1">
          {smartLists.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                currentPath === item.path
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                  : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
                item.className
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-xs text-surface-500">{item.count}</span>
              )}
            </Link>
          ))}
        </div>

        {/* Projects */}
        <div className="mt-6">
          <div className="flex items-center gap-2 px-3 py-2">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-500"
            >
              {projectsExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Projects
            </button>
            <button
              onClick={() => openProjectModal()}
              className="ml-auto p-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700"
              title="Add project"
            >
              <Plus className="h-4 w-4 text-surface-500 hover:text-surface-700 dark:hover:text-surface-300" />
            </button>
          </div>

          {projectsExpanded && (
            <div className="mt-1 space-y-1">
              {projects?.map((project) => (
                <div key={project.id} className="group flex items-center">
                  <Link
                    to="/projects/$projectId"
                    params={{ projectId: project.id }}
                    className={cn(
                      'flex flex-1 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      currentPath === `/projects/${project.id}`
                        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                        : 'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800'
                    )}
                  >
                    <Hash className="h-4 w-4" style={{ color: getColorHex(project.color) }} />
                    <span className="flex-1 truncate">{project.name}</span>
                    {project._count?.tasks !== undefined && project._count.tasks > 0 && (
                      <span className="text-xs text-surface-500">{project._count.tasks}</span>
                    )}
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openProjectModal(project.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 mr-1 rounded hover:bg-surface-200 dark:hover:bg-surface-700 transition-opacity"
                    title="Edit project"
                  >
                    <Pencil className="h-3 w-3 text-surface-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom actions */}
      <div className="border-t p-2">
        <button
          onClick={toggleChat}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
        >
          <MessageSquare className="h-5 w-5" />
          <span>AI Assistant</span>
        </button>
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800"
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
