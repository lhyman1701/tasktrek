# TASK-050: Eisenhower Matrix View

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Add Eisenhower Matrix view for prioritizing tasks by urgency and importance.

## Matrix Layout

```
         URGENT          NOT URGENT
       ┌─────────────┬─────────────┐
IMPORT │ DO FIRST    │ SCHEDULE    │
 ANT   │ (P1)        │ (P2)        │
       ├─────────────┼─────────────┤
NOT    │ DELEGATE    │ ELIMINATE   │
IMPORT │ (P3)        │ (P4)        │
       └─────────────┴─────────────┘
```

## Implementation

```typescript
// components/EisenhowerMatrix.tsx
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useTasks, useUpdateTask } from '@/hooks';

const quadrants = [
  {
    id: 'urgent-important',
    title: 'Do First',
    subtitle: 'Urgent & Important',
    priority: 1,
    color: 'red'
  },
  {
    id: 'not-urgent-important',
    title: 'Schedule',
    subtitle: 'Important, Not Urgent',
    priority: 2,
    color: 'blue'
  },
  {
    id: 'urgent-not-important',
    title: 'Delegate',
    subtitle: 'Urgent, Not Important',
    priority: 3,
    color: 'yellow'
  },
  {
    id: 'not-urgent-not-important',
    title: 'Eliminate',
    subtitle: 'Not Urgent or Important',
    priority: 4,
    color: 'gray'
  }
];

export function EisenhowerMatrix() {
  const { data: tasks } = useTasks({ completed: false });
  const updateTask = useUpdateTask();

  const getTasksByPriority = (priority: number) =>
    tasks?.filter(t => t.priority === priority) || [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const quadrant = quadrants.find(q => q.id === over.id);
    if (!quadrant) return;

    updateTask.mutate({
      id: taskId,
      priority: `p${quadrant.priority}`
    });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-full p-4">
        <h1 className="text-xl font-bold mb-4">Eisenhower Matrix</h1>

        <div className="grid grid-cols-2 gap-4 h-[calc(100%-4rem)]">
          {/* Labels */}
          <div className="col-span-2 grid grid-cols-2">
            <div className="text-center font-semibold text-sm text-gray-500">
              URGENT
            </div>
            <div className="text-center font-semibold text-sm text-gray-500">
              NOT URGENT
            </div>
          </div>

          {quadrants.map((quadrant, index) => (
            <MatrixQuadrant
              key={quadrant.id}
              quadrant={quadrant}
              tasks={getTasksByPriority(quadrant.priority)}
              showImportantLabel={index === 0 || index === 2}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}

function MatrixQuadrant({
  quadrant,
  tasks,
  showImportantLabel
}: MatrixQuadrantProps) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id });

  return (
    <div className="relative">
      {showImportantLabel && (
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm text-gray-500">
          {quadrant.priority <= 2 ? 'IMPORTANT' : 'NOT IMPORTANT'}
        </div>
      )}

      <div
        ref={setNodeRef}
        className={cn(
          'h-full p-4 rounded-lg border-2',
          `border-${quadrant.color}-200`,
          `bg-${quadrant.color}-50`,
          isOver && `border-${quadrant.color}-500`
        )}
      >
        <h3 className="font-semibold">{quadrant.title}</h3>
        <p className="text-xs text-gray-500 mb-3">{quadrant.subtitle}</p>

        <SortableContext items={tasks.map(t => t.id)}>
          <div className="space-y-2">
            {tasks.map(task => (
              <DraggableTaskCard key={task.id} task={task} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

function DraggableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: task.id
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'p-2 bg-white rounded shadow-sm cursor-grab',
        isDragging && 'opacity-50'
      )}
      style={{ transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined }}
    >
      <p className="text-sm">{task.content}</p>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Matrix displays 4 quadrants
2. [ ] Tasks sorted by priority
3. [ ] Drag tasks between quadrants
4. [ ] Priority updates on drop
5. [ ] Visual feedback on drag
6. [ ] Labels (Urgent/Important) display
