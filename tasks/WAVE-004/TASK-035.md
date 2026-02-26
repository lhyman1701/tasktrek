# TASK-035: Build Task Detail Screen

## Status: blocked

## Dependencies

- TASK-033

## Description

Build task detail screen for viewing and editing.

## Implementation

```typescript
// app/task/[id].tsx
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useTask, useUpdateTask, useDeleteTask } from '@taskflow/shared';
import { EditableText } from '@/components/EditableText';
import { DatePickerRow } from '@/components/DatePickerRow';
import { PriorityPicker } from '@/components/PriorityPicker';
import { ProjectPicker } from '@/components/ProjectPicker';
import { LabelPicker } from '@/components/LabelPicker';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  if (isLoading) return <LoadingScreen />;
  if (!task) return null;

  const handleUpdate = (field: string, value: any) => {
    updateTask.mutate({ id, [field]: value });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTask.mutate(id);
            router.back();
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable onPress={handleDelete}>
              <Text style={styles.deleteButton}>Delete</Text>
            </Pressable>
          )
        }}
      />

      <ScrollView style={styles.container}>
        {/* Content */}
        <View style={styles.section}>
          <EditableText
            value={task.content}
            onSave={(content) => handleUpdate('content', content)}
            style={styles.title}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <EditableText
            value={task.description || ''}
            onSave={(description) => handleUpdate('description', description)}
            placeholder="Add description..."
            multiline
          />
        </View>

        {/* Due Date */}
        <DatePickerRow
          label="Due Date"
          value={task.dueDate}
          onChange={(dueDate) => handleUpdate('dueDate', dueDate)}
        />

        {/* Priority */}
        <PriorityPicker
          value={task.priority}
          onChange={(priority) => handleUpdate('priority', priority)}
        />

        {/* Project */}
        <ProjectPicker
          value={task.projectId}
          onChange={(projectId) => handleUpdate('projectId', projectId)}
        />

        {/* Labels */}
        <LabelPicker
          value={task.labels?.map(l => l.id) || []}
          onChange={(labels) => handleUpdate('labels', labels)}
        />

        {/* Metadata */}
        <View style={styles.metadata}>
          <Text style={styles.metaText}>
            Created {formatDate(task.createdAt)}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  title: {
    fontSize: 20,
    fontWeight: '600'
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4
  },
  deleteButton: {
    color: '#ef4444'
  },
  metadata: {
    padding: 16
  },
  metaText: {
    fontSize: 12,
    color: '#9ca3af'
  }
});
```

## Acceptance Criteria

1. [ ] Task details display
2. [ ] Inline editing works
3. [ ] Date picker works
4. [ ] Priority picker works
5. [ ] Project picker works
6. [ ] Labels multi-select
7. [ ] Delete with confirmation
8. [ ] Navigate back after delete
