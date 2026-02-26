import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  Search,
  Plus,
  Calendar,
  Inbox,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Settings,
  Hash,
  MessageSquare,
  Moon,
  Sun
} from 'lucide-react';
import { useProjects } from '@/hooks/useProjects';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';

interface Command {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const { toggleChat, theme, setTheme } = useUIStore();

  // Build command list
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-today',
      title: 'Go to Today',
      icon: Calendar,
      action: () => navigate({ to: '/' }),
      keywords: ['today', 'home']
    },
    {
      id: 'nav-inbox',
      title: 'Go to Inbox',
      icon: Inbox,
      action: () => navigate({ to: '/inbox' }),
      keywords: ['inbox']
    },
    {
      id: 'nav-upcoming',
      title: 'Go to Upcoming',
      icon: CalendarDays,
      action: () => navigate({ to: '/upcoming' }),
      keywords: ['upcoming', 'week']
    },
    {
      id: 'nav-overdue',
      title: 'Go to Overdue',
      icon: AlertCircle,
      action: () => navigate({ to: '/overdue' }),
      keywords: ['overdue', 'late']
    },
    {
      id: 'nav-completed',
      title: 'Go to Completed',
      icon: CheckCircle2,
      action: () => navigate({ to: '/completed' }),
      keywords: ['completed', 'done']
    },
    {
      id: 'nav-settings',
      title: 'Go to Settings',
      icon: Settings,
      action: () => navigate({ to: '/settings' }),
      keywords: ['settings', 'preferences']
    },

    // Actions
    {
      id: 'action-new-task',
      title: 'New Task',
      subtitle: '⌘K',
      icon: Plus,
      action: () => {
        // Focus quick add bar
        const quickAdd = document.querySelector('input[placeholder*="Add a task"]') as HTMLInputElement;
        quickAdd?.focus();
      },
      keywords: ['new', 'add', 'create', 'task']
    },
    {
      id: 'action-chat',
      title: 'Open AI Assistant',
      icon: MessageSquare,
      action: () => toggleChat(),
      keywords: ['ai', 'chat', 'assistant', 'help']
    },
    {
      id: 'action-theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
      keywords: ['theme', 'dark', 'light', 'mode']
    },

    // Projects
    ...(projects?.map((project) => ({
      id: `project-${project.id}`,
      title: project.name,
      subtitle: 'Project',
      icon: Hash,
      action: () => navigate({ to: '/projects/$projectId', params: { projectId: project.id } }),
      keywords: ['project', project.name.toLowerCase()]
    })) || [])
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter((cmd) => {
        const searchText = `${cmd.title} ${cmd.subtitle || ''} ${cmd.keywords?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : commands;

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + P to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            setIsOpen(false);
          }
          break;
      }
    },
    [filteredCommands, selectedIndex]
  );

  // Reset selected index when filtering
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onClick={() => setIsOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg rounded-xl border bg-white shadow-2xl dark:bg-surface-800 animate-slide-down"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-5 w-5 text-surface-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search commands..."
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-surface-400"
          />
          <kbd className="rounded bg-surface-100 px-2 py-1 text-xs text-surface-500 dark:bg-surface-700">
            esc
          </kbd>
        </div>

        {/* Commands list */}
        <div className="max-h-80 overflow-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-surface-500">
              No commands found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    index === selectedIndex
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                      : 'hover:bg-surface-100 dark:hover:bg-surface-700'
                  )}
                >
                  <cmd.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div className="font-medium">{cmd.title}</div>
                    {cmd.subtitle && (
                      <div className="text-xs text-surface-500">{cmd.subtitle}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-surface-500">
          <span>Press ↑↓ to navigate, Enter to select</span>
          <span>⌘P to open</span>
        </div>
      </div>
    </div>
  );
}
