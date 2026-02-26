# TASK-022: Build Sidebar with Projects/Labels

## Status: blocked

## Dependencies

- TASK-020, TASK-021

## Description

Build sidebar with smart lists, projects, and labels navigation.

## Implementation

```typescript
// components/Sidebar.tsx
import { Link, useLocation } from '@tanstack/react-router';
import { useProjects, useLabels, useSmartListCounts } from '@/hooks';
import {
  InboxIcon, CalendarIcon, CalendarDaysIcon,
  FolderIcon, TagIcon
} from '@heroicons/react/24/outline';

export function Sidebar() {
  const location = useLocation();
  const { data: counts } = useSmartListCounts();
  const { data: projects } = useProjects();
  const { data: labels } = useLabels();

  const smartLists = [
    { to: '/inbox', icon: InboxIcon, label: 'Inbox', count: counts?.inbox },
    { to: '/today', icon: CalendarIcon, label: 'Today', count: counts?.today },
    { to: '/upcoming', icon: CalendarDaysIcon, label: 'Upcoming', count: counts?.upcoming }
  ];

  return (
    <nav className="h-full flex flex-col py-4">
      {/* Smart Lists */}
      <div className="px-3 mb-4">
        {smartLists.map(({ to, icon: Icon, label, count }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex items-center px-3 py-2 rounded-md',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              location.pathname === to && 'bg-primary-50 text-primary-600'
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span className="flex-1">{label}</span>
            {count > 0 && (
              <span className="text-sm text-gray-500">{count}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Projects */}
      <div className="px-3 mb-4">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase">
          Projects
        </h3>
        {projects?.map(project => (
          <Link
            key={project.id}
            to={`/project/${project.id}`}
            className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
          >
            <FolderIcon className="w-5 h-5 mr-3" style={{ color: project.color }} />
            <span>{project.name}</span>
          </Link>
        ))}
      </div>

      {/* Labels */}
      <div className="px-3">
        <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase">
          Labels
        </h3>
        {labels?.map(label => (
          <Link
            key={label.id}
            to={`/label/${label.id}`}
            className="flex items-center px-3 py-2 rounded-md hover:bg-gray-100"
          >
            <TagIcon className="w-5 h-5 mr-3" style={{ color: label.color }} />
            <span>{label.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

## Acceptance Criteria

1. [ ] Smart lists with counts
2. [ ] Projects list with colors
3. [ ] Labels list with colors
4. [ ] Active route highlighted
5. [ ] Hover states
