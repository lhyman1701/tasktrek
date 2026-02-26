# TASK-046: iOS Widgets

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Create iOS widgets showing Today tasks and Quick Add.

## Widget Types

### Small Widget (Today Count)
- Shows number of tasks due today
- Shows first task title
- Tap opens app

### Medium Widget (Today List)
- Shows up to 3 tasks due today
- Checkbox to complete
- Tap task opens detail

### Large Widget (Today + Quick Add)
- Shows 5 tasks
- Quick add button
- Checkboxes

## Implementation

### Expo Config

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "expo-widgets",
        {
          "ios": {
            "widgetExtension": {
              "name": "TaskFlowWidget",
              "bundleId": "com.taskflow.app.widget"
            }
          }
        }
      ]
    ]
  }
}
```

### Widget Code (Swift)

```swift
// Widget/TaskFlowWidget.swift
import WidgetKit
import SwiftUI

struct TaskEntry: TimelineEntry {
    let date: Date
    let tasks: [TaskItem]
}

struct TaskItem: Identifiable {
    let id: String
    let content: String
    let priority: Int
    let isCompleted: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> TaskEntry {
        TaskEntry(date: Date(), tasks: [
            TaskItem(id: "1", content: "Example task", priority: 2, isCompleted: false)
        ])
    }

    func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> ()) {
        let entry = TaskEntry(date: Date(), tasks: loadTasks())
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> ()) {
        let tasks = loadTasks()
        let entry = TaskEntry(date: Date(), tasks: tasks)

        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    func loadTasks() -> [TaskItem] {
        // Load from shared App Group container
        guard let sharedDefaults = UserDefaults(suiteName: "group.com.taskflow.app"),
              let data = sharedDefaults.data(forKey: "todayTasks"),
              let tasks = try? JSONDecoder().decode([TaskItem].self, from: data)
        else {
            return []
        }
        return tasks
    }
}

struct SmallWidgetView: View {
    let entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading) {
            Text("\(entry.tasks.count)")
                .font(.system(size: 48, weight: .bold))
            Text("tasks today")
                .font(.caption)
                .foregroundColor(.secondary)

            if let first = entry.tasks.first {
                Text(first.content)
                    .font(.caption)
                    .lineLimit(1)
            }
        }
        .padding()
    }
}

struct MediumWidgetView: View {
    let entry: TaskEntry

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Today")
                .font(.headline)

            ForEach(entry.tasks.prefix(3)) { task in
                HStack {
                    Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                        .foregroundColor(task.isCompleted ? .green : .gray)
                    Text(task.content)
                        .lineLimit(1)
                        .strikethrough(task.isCompleted)
                }
            }
        }
        .padding()
    }
}

@main
struct TaskFlowWidget: Widget {
    let kind: String = "TaskFlowWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            SmallWidgetView(entry: entry)
        }
        .configurationDisplayName("Today Tasks")
        .description("View and manage today's tasks")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}
```

### Shared Data (React Native)

```typescript
// lib/widgetData.ts
import { SharedGroupPreferences } from 'react-native-shared-group-preferences';

const group = 'group.com.taskflow.app';

export async function updateWidgetData(tasks: Task[]) {
  const todayTasks = tasks
    .filter(t => isToday(new Date(t.dueDate!)))
    .slice(0, 5)
    .map(t => ({
      id: t.id,
      content: t.content,
      priority: t.priority,
      isCompleted: t.isCompleted
    }));

  await SharedGroupPreferences.setItem(
    'todayTasks',
    JSON.stringify(todayTasks),
    group
  );

  // Trigger widget refresh
  WidgetKit.reloadAllTimelines();
}
```

## Acceptance Criteria

1. [ ] Small widget shows count
2. [ ] Medium widget shows 3 tasks
3. [ ] Widgets update automatically
4. [ ] Tap opens app
5. [ ] Dark mode supported
6. [ ] Widget gallery shows options
