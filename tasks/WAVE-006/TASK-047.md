# TASK-047: iOS Shortcuts Integration

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Add Siri Shortcuts support for quick task creation and queries.

## Shortcuts to Support

1. **Add Task** - Create task with voice input
2. **Show Today** - Read today's tasks
3. **Complete Task** - Mark task as done
4. **Quick Add** - Add task with natural language

## Implementation

### Expo Config

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-siri-shortcuts",
        {
          "intents": [
            {
              "activityType": "com.taskflow.app.addTask",
              "title": "Add Task",
              "description": "Add a new task to TaskFlow",
              "suggestedPhrase": "Add task to TaskFlow"
            },
            {
              "activityType": "com.taskflow.app.showToday",
              "title": "Show Today",
              "description": "Show today's tasks",
              "suggestedPhrase": "Show my tasks for today"
            }
          ]
        }
      ]
    ]
  }
}
```

### Intent Handling

```typescript
// lib/shortcuts.ts
import * as IntentHandler from 'expo-intent-handler';
import * as Shortcuts from 'expo-siri-shortcuts';
import { api } from '@taskflow/shared';

// Register shortcut handlers
IntentHandler.registerHandler('com.taskflow.app.addTask', async (params) => {
  const { text } = params;

  // Parse and create task
  const result = await api.ai.quickAdd(text);

  return {
    success: true,
    message: `Added task: ${result.task.content}`
  };
});

IntentHandler.registerHandler('com.taskflow.app.showToday', async () => {
  const { tasks } = await api.smartLists.get('today');

  if (tasks.length === 0) {
    return {
      success: true,
      message: "You have no tasks due today. Enjoy your free time!"
    };
  }

  const taskList = tasks
    .slice(0, 5)
    .map((t, i) => `${i + 1}. ${t.content}`)
    .join('. ');

  return {
    success: true,
    message: `You have ${tasks.length} tasks today. ${taskList}`
  };
});

// Donate shortcuts for Siri suggestions
export async function donateShortcuts() {
  await Shortcuts.donateShortcut({
    activityType: 'com.taskflow.app.addTask',
    title: 'Add Task to TaskFlow',
    suggestedPhrase: 'Add task'
  });

  await Shortcuts.donateShortcut({
    activityType: 'com.taskflow.app.showToday',
    title: 'Show Today\'s Tasks',
    suggestedPhrase: 'Show my tasks'
  });
}
```

### App Integration

```typescript
// App.tsx
import { useEffect } from 'react';
import { donateShortcuts } from '@/lib/shortcuts';

export default function App() {
  useEffect(() => {
    // Donate shortcuts when app opens
    donateShortcuts();
  }, []);

  // ... rest of app
}
```

## Shortcuts App Actions

Users can create automations in Shortcuts app:

### Morning Routine
1. Get Today's Tasks
2. Speak results

### Add Task Voice
1. Dictate Text
2. Add Task (with dictated text)

## Acceptance Criteria

1. [ ] Add Task shortcut works
2. [ ] Show Today reads tasks aloud
3. [ ] Shortcuts appear in Siri Suggestions
4. [ ] Works with Shortcuts app automations
5. [ ] Voice input works correctly
6. [ ] Shortcuts work when app is closed
