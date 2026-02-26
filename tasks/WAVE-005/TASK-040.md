# TASK-040: Add Empty States and Onboarding

## Status: blocked

## Dependencies

- WAVE-003, WAVE-004 complete

## Description

Design and implement empty states and first-run onboarding.

## Empty States

### Inbox Empty
```
Illustration: Inbox with sparkles
Title: "Inbox Zero!"
Subtitle: "No tasks in your inbox. Add one to get started."
CTA: "Add Task" button
```

### Today Empty
```
Illustration: Calendar with checkmark
Title: "All done for today!"
Subtitle: "Enjoy your free time or plan ahead."
CTA: "Plan Tomorrow" button
```

### Project Empty
```
Illustration: Folder
Title: "No tasks yet"
Subtitle: "Add tasks to this project to get organized."
CTA: "Add Task" button
```

### Search No Results
```
Illustration: Magnifying glass
Title: "No results found"
Subtitle: "Try a different search term."
```

## Implementation

```typescript
// components/EmptyState.tsx
interface EmptyStateProps {
  type: 'inbox' | 'today' | 'project' | 'search';
  onAction?: () => void;
}

const configs = {
  inbox: {
    illustration: InboxIllustration,
    title: 'Inbox Zero!',
    subtitle: 'No tasks in your inbox. Add one to get started.',
    action: 'Add Task'
  },
  // ... other types
};

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const config = configs[type];
  const Illustration = config.illustration;

  return (
    <View style={styles.container}>
      <Illustration width={120} height={120} />
      <Text style={styles.title}>{config.title}</Text>
      <Text style={styles.subtitle}>{config.subtitle}</Text>
      {config.action && onAction && (
        <Button onPress={onAction}>{config.action}</Button>
      )}
    </View>
  );
}
```

## Onboarding Flow

### Screens

1. **Welcome**
   - TaskFlow logo
   - "Your AI-powered task manager"
   - Continue button

2. **Quick Add**
   - Demo of natural language input
   - "Just type naturally"
   - "Buy milk tomorrow at 3pm"

3. **AI Chat**
   - Chat interface preview
   - "Chat with AI to manage tasks"
   - Example conversation

4. **Get Started**
   - "Let's add your first task"
   - Input field
   - Skip option

### Implementation

```typescript
// app/onboarding.tsx
import { Animated } from 'react-native';
import PagerView from 'react-native-pager-view';

const screens = [
  { component: WelcomeScreen },
  { component: QuickAddScreen },
  { component: ChatScreen },
  { component: GetStartedScreen }
];

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  const handleComplete = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        onPageSelected={e => setPage(e.nativeEvent.position)}
      >
        {screens.map((Screen, index) => (
          <View key={index}>
            <Screen.component />
          </View>
        ))}
      </PagerView>

      <PageIndicator current={page} total={screens.length} />

      <View style={styles.buttons}>
        {page < screens.length - 1 ? (
          <>
            <Button variant="ghost" onPress={handleComplete}>
              Skip
            </Button>
            <Button onPress={() => pagerRef.current?.setPage(page + 1)}>
              Next
            </Button>
          </>
        ) : (
          <Button onPress={handleComplete}>Get Started</Button>
        )}
      </View>
    </View>
  );
}
```

## Acceptance Criteria

1. [ ] Empty states for all list views
2. [ ] Illustrations render correctly
3. [ ] CTAs trigger appropriate actions
4. [ ] Onboarding shows on first launch
5. [ ] Can skip onboarding
6. [ ] Onboarding doesn't show again
7. [ ] Works on both web and mobile
