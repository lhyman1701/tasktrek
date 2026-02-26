# TASK-038: Implement Push Notifications

## Status: blocked

## Dependencies

- TASK-030

## Description

Set up push notifications for task reminders.

## Implementation

### Expo Config

```json
// app.json additions
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0ea5e9"
        }
      ]
    ]
  }
}
```

### Notification Service

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token');
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id'
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX
    });
  }

  return token.data;
}

export async function scheduleTaskReminder(task: Task) {
  if (!task.dueDate) return;

  const trigger = new Date(task.dueDate);
  trigger.setMinutes(trigger.getMinutes() - 15); // 15 min before

  if (trigger <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Task Due Soon',
      body: task.content,
      data: { taskId: task.id }
    },
    trigger
  });
}

export async function cancelTaskReminder(taskId: string) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const notification = scheduled.find(
    n => n.content.data?.taskId === taskId
  );

  if (notification) {
    await Notifications.cancelScheduledNotificationAsync(
      notification.identifier
    );
  }
}
```

### App Setup

```typescript
// App.tsx or app/_layout.tsx
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { registerForPushNotifications } from '@/lib/notifications';
import { api } from '@taskflow/shared';

export default function RootLayout() {
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Register for push
    registerForPushNotifications().then(token => {
      if (token) {
        // Send token to backend
        api.user.updatePushToken(token);
      }
    });

    // Handle received notification
    notificationListener.current =
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

    // Handle notification tap
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(response => {
        const taskId = response.notification.request.content.data?.taskId;
        if (taskId) {
          router.push(`/task/${taskId}`);
        }
      });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return <Slot />;
}
```

## Backend Changes

```typescript
// packages/api/src/routes/user.ts
router.post('/push-token', async (req, res) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { pushToken: req.body.token }
  });
  res.json({ success: true });
});

// When task with due date is created/updated
// Schedule reminder via Expo Push API
```

## Acceptance Criteria

1. [ ] Permission requested on first launch
2. [ ] Push token sent to backend
3. [ ] Local notifications scheduled for due tasks
4. [ ] Tap notification opens task
5. [ ] Notifications work in background
6. [ ] Badge count updates
