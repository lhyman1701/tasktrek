# TASK-036: Add Swipe Actions (Complete/Delete)

## Status: blocked

## Dependencies

- TASK-033

## Description

Add swipe-to-complete and swipe-to-delete actions.

## Implementation

```typescript
// components/SwipeableTaskRow.tsx
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useCompleteTask, useDeleteTask } from '@taskflow/shared';

interface SwipeableTaskRowProps {
  task: Task;
  children: React.ReactNode;
}

export function SwipeableTaskRow({ task, children }: SwipeableTaskRowProps) {
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  let swipeableRef: Swipeable | null = null;

  const handleComplete = () => {
    completeTask.mutate(task.id);
    swipeableRef?.close();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure?',
      [
        { text: 'Cancel', onPress: () => swipeableRef?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask.mutate(task.id)
        }
      ]
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0]
    });

    return (
      <Animated.View
        style={[styles.leftAction, { transform: [{ translateX }] }]}
      >
        <RectButton style={styles.completeButton} onPress={handleComplete}>
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.actionText}>Complete</Text>
        </RectButton>
      </Animated.View>
    );
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0]
    });

    return (
      <Animated.View
        style={[styles.rightAction, { transform: [{ translateX }] }]}
      >
        <RectButton style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={24} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </RectButton>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={(ref) => (swipeableRef = ref)}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      leftThreshold={40}
      rightThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftAction: {
    width: 80,
    backgroundColor: '#22c55e'
  },
  rightAction: {
    width: 80,
    backgroundColor: '#ef4444'
  },
  completeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4
  }
});

// Usage in task list
<SwipeableTaskRow task={task}>
  <TaskRow task={task} />
</SwipeableTaskRow>
```

## Acceptance Criteria

1. [ ] Swipe left reveals delete
2. [ ] Swipe right reveals complete
3. [ ] Actions execute on tap
4. [ ] Delete shows confirmation
5. [ ] Complete toggles state
6. [ ] Smooth animations
