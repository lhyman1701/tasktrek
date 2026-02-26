# TASK-031: Set Up Tab Navigation

## Status: blocked

## Dependencies

- TASK-030

## Description

Configure tab navigation with Expo Router.

## Files to Create

```
packages/mobile/src/app/
├── _layout.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx       # Inbox
│   ├── today.tsx
│   ├── chat.tsx
│   └── settings.tsx
└── task/
    └── [id].tsx
```

## Implementation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0ea5e9',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb'
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mail-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubble-outline" size={size} color={color} />
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          )
        }}
      />
    </Tabs>
  );
}
```

## Acceptance Criteria

1. [ ] Four tabs display
2. [ ] Tab icons render
3. [ ] Active tab highlighted
4. [ ] Navigation works
5. [ ] Stack navigation for details
