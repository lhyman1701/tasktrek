import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Plus, Sparkles, Loader2 } from 'lucide-react';
import { useQuickAdd } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

export function QuickAddBar() {
  const [value, setValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const quickAdd = useQuickAdd();

  // Keyboard shortcut: Cmd/Ctrl + K to focus
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsExpanded(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    try {
      await quickAdd.mutateAsync({ text: value });
      setValue('');
      setIsExpanded(false);
      inputRef.current?.blur();
    } catch (error) {
      console.error('Failed to add task:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setValue('');
      setIsExpanded(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="border-b bg-white dark:bg-surface-800">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {quickAdd.isPending ? (
              <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
            ) : (
              <Plus className="h-5 w-5 text-surface-400" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsExpanded(true)}
            onBlur={() => !value && setIsExpanded(false)}
            onKeyDown={handleKeyDown}
            placeholder="Add a task... (⌘K)"
            className={cn(
              'input pl-10 pr-10',
              isExpanded && 'ring-2 ring-primary-500'
            )}
            disabled={quickAdd.isPending}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3" title="AI-powered natural language">
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
        </div>

        {isExpanded && value && (
          <button
            onClick={handleSubmit}
            disabled={quickAdd.isPending}
            className="btn-primary"
          >
            {quickAdd.isPending ? 'Adding...' : 'Add Task'}
          </button>
        )}
      </div>

      {/* AI hint */}
      {isExpanded && (
        <div className="px-4 pb-3 text-xs text-surface-500">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Try: "Meeting with John tomorrow at 2pm #work p1" or "Buy groceries due Friday"
          </span>
        </div>
      )}
    </div>
  );
}
