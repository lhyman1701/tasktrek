# TASK-024: Build Quick Add Bar

## Status: blocked

## Dependencies

- TASK-020

## Description

Build quick add bar with natural language parsing preview.

## Implementation

```typescript
// components/QuickAdd.tsx
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { debounce } from '@/lib/utils';

export function QuickAdd() {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedTask | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const quickAdd = useMutation({
    mutationFn: api.ai.quickAdd,
    onSuccess: () => {
      setText('');
      setPreview(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const debouncedParse = useCallback(
    debounce(async (value: string) => {
      if (value.length < 3) {
        setPreview(null);
        return;
      }
      setIsLoading(true);
      try {
        const parsed = await api.ai.parse(value);
        setPreview(parsed);
      } catch {
        setPreview(null);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setText(value);
    debouncedParse(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    quickAdd.mutate(text);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center border rounded-lg shadow-sm">
        <PlusIcon className="w-5 h-5 ml-3 text-gray-400" />
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder="Add task... (try: 'Buy milk tomorrow at 3pm')"
          className="flex-1 px-3 py-2 outline-none"
        />
        {isLoading && <Spinner className="mr-3" />}
        <button
          type="submit"
          disabled={!text.trim() || quickAdd.isPending}
          className="px-4 py-2 bg-primary-600 text-white rounded-r-lg"
        >
          Add
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="absolute top-full left-0 right-0 mt-1 p-3 bg-white rounded-lg shadow-lg border">
          <p className="font-medium">{preview.content}</p>
          <div className="flex gap-2 mt-1 text-sm text-gray-500">
            {preview.dueDate && (
              <span>📅 {formatDate(preview.dueDate)}</span>
            )}
            {preview.priority && (
              <span>🚩 {preview.priority}</span>
            )}
            {preview.labels?.map(l => (
              <span key={l}>#{l}</span>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
```

## Acceptance Criteria

1. [ ] Input captures text
2. [ ] Debounced parsing preview
3. [ ] Preview shows parsed data
4. [ ] Submit creates task
5. [ ] Input clears on success
6. [ ] Loading indicator
7. [ ] Keyboard support (Enter)
