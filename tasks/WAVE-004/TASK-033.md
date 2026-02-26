# TASK-033: Build Inbox Tab (Task List)

## Status: blocked

## Dependencies

- TASK-031, TASK-032

## Description

Build the Inbox tab showing tasks without a project.

## Implementation

```typescript
// app/(tabs)/index.tsx
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { useSmartList } from '@taskflow/shared';
import { TaskRow } from '@/components/TaskRow';
import { QuickAddButton } from '@/components/QuickAddButton';

export default function InboxScreen() {
  const { data, isLoading, refetch } = useSmartList('inbox');

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskRow task={item} />}
        ListEmptyComponent={<EmptyState message="Inbox is empty" />}
        onRefresh={refetch}
        refreshing={isLoading}
      />
      <QuickAddButton />
    </View>
  );
}

// components/TaskRow.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Checkbox } from './Checkbox';
import { PriorityDot } from './PriorityDot';
import { useCompleteTask } from '@taskflow/shared';

interface TaskRowProps {
  task: Task;
}

export function TaskRow({ task }: TaskRowProps) {
  const completeTask = useCompleteTask();

  return (
    <Link href={`/task/${task.id}`} asChild>
      <Pressable style={styles.row}>
        <Checkbox
          checked={task.isCompleted}
          onPress={() => completeTask.mutate(task.id)}
        />
        <PriorityDot priority={task.priority} />
        <View style={styles.content}>
          <Text style={[
            styles.title,
            task.isCompleted && styles.completed
          ]}>
            {task.content}
          </Text>
          {task.dueDate && (
            <Text style={styles.dueDate}>
              {formatDueDate(task.dueDate)}
            </Text>
          )}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  content: {
    flex: 1,
    marginLeft: 12
  },
  title: {
    fontSize: 16
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#9ca3af'
  },
  dueDate: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4
  }
});
```

## Acceptance Criteria

1. [ ] Task list renders
2. [ ] Pull to refresh works
3. [ ] Checkbox toggles completion
4. [ ] Priority dot shows
5. [ ] Due date displays
6. [ ] Empty state shown
7. [ ] Tap navigates to detail
