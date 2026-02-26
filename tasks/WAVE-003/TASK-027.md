# TASK-027: Build Board View (Kanban)

## Status: blocked

## Dependencies

- TASK-023

## Description

Build Kanban board view with sections as columns.

## Implementation

```typescript
// components/BoardView.tsx
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { useProjectWithSections, useMoveTask } from '@/hooks';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';

interface BoardViewProps {
  projectId: string;
}

export function BoardView({ projectId }: BoardViewProps) {
  const { data: project, isLoading } = useProjectWithSections(projectId);
  const moveTask = useMoveTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const task = findTask(event.active.id as string);
    setActiveTask(task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const sectionId = over.id as string;

    moveTask.mutate({ taskId, sectionId });
  };

  if (isLoading) return <BoardSkeleton />;

  return (
    <DndContext
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-4 overflow-x-auto h-full">
        {/* No Section Column */}
        <BoardColumn
          id="no-section"
          title="No Section"
          tasks={project?.tasks.filter(t => !t.sectionId) || []}
        />

        {/* Section Columns */}
        {project?.sections.map(section => (
          <BoardColumn
            key={section.id}
            id={section.id}
            title={section.name}
            tasks={project.tasks.filter(t => t.sectionId === section.id)}
          />
        ))}

        {/* Add Section */}
        <AddSectionColumn projectId={projectId} />
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

// components/BoardColumn.tsx
import { useDroppable } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';

export function BoardColumn({ id, title, tasks }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-72 bg-gray-50 dark:bg-gray-900 rounded-lg',
        isOver && 'ring-2 ring-primary-500'
      )}
    >
      <div className="p-3 font-medium flex items-center justify-between">
        <span>{title}</span>
        <span className="text-sm text-gray-500">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map(t => t.id)}>
        <div className="p-2 space-y-2 min-h-[200px]">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Sections as columns
2. [ ] Drag tasks between columns
3. [ ] Drag reorder within column
4. [ ] Add section button
5. [ ] Task count per column
6. [ ] Horizontal scroll
7. [ ] Drag overlay shows task
