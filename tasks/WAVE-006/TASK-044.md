# TASK-044: Calendar View (Web)

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Add calendar view showing tasks by due date.

## Implementation

```typescript
// components/CalendarView.tsx
import { useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  format, isSameDay, isToday, addMonths
} from 'date-fns';
import { useTasks } from '@/hooks';

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: tasks } = useTasks({
    dueDate: {
      gte: startOfMonth(currentMonth).toISOString(),
      lte: endOfMonth(currentMonth).toISOString()
    }
  });

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getTasksForDay = (day: Date) =>
    tasks?.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day)) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button onClick={() => setCurrentMonth(m => addMonths(m, -1))}>
          ←
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
          →
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 auto-rows-fr">
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'border-r border-b p-1 min-h-[100px]',
                isToday(day) && 'bg-primary-50'
              )}
            >
              <div className={cn(
                'text-sm mb-1',
                isToday(day) && 'font-bold text-primary-600'
              )}>
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayTasks.slice(0, 3).map(task => (
                  <div
                    key={task.id}
                    className="text-xs p-1 rounded bg-gray-100 truncate"
                  >
                    {task.content}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

## Features

- Month navigation
- Today highlighted
- Tasks shown on due dates
- Click day to filter task list
- Drag task to reschedule

## Acceptance Criteria

1. [ ] Calendar renders current month
2. [ ] Navigation between months
3. [ ] Tasks appear on correct days
4. [ ] Today is highlighted
5. [ ] Click day shows day's tasks
6. [ ] Drag to reschedule (optional)
