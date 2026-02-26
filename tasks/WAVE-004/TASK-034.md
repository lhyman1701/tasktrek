# TASK-034: Build Quick Add Screen

## Status: blocked

## Dependencies

- TASK-032

## Description

Build quick add modal with NLP parsing preview.

## Implementation

```typescript
// app/add.tsx
import { useState, useCallback } from 'react';
import {
  View, TextInput, Text, Pressable, StyleSheet, KeyboardAvoidingView
} from 'react-native';
import { router } from 'expo-router';
import { useParseTasks, useQuickAdd } from '@taskflow/shared';
import { debounce } from '@/lib/utils';

export default function AddScreen() {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<ParsedTask | null>(null);

  const parseTask = useParseTasks();
  const quickAdd = useQuickAdd();

  const debouncedParse = useCallback(
    debounce(async (value: string) => {
      if (value.length < 3) {
        setPreview(null);
        return;
      }
      const result = await parseTask.mutateAsync(value);
      setPreview(result);
    }, 300),
    []
  );

  const handleChangeText = (value: string) => {
    setText(value);
    debouncedParse(value);
  };

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await quickAdd.mutateAsync(text);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Add Task</Text>
        <Pressable onPress={handleSubmit} disabled={!text.trim()}>
          <Text style={[
            styles.done,
            !text.trim() && styles.disabled
          ]}>
            Done
          </Text>
        </Pressable>
      </View>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={handleChangeText}
        placeholder="What do you need to do?"
        autoFocus
        multiline
      />

      {/* Parse Preview */}
      {preview && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>{preview.content}</Text>
          <View style={styles.previewMeta}>
            {preview.dueDate && (
              <View style={styles.badge}>
                <Text>📅 {formatDate(preview.dueDate)}</Text>
              </View>
            )}
            {preview.priority && (
              <View style={styles.badge}>
                <Text>🚩 {preview.priority}</Text>
              </View>
            )}
            {preview.labels?.map(l => (
              <View key={l} style={styles.badge}>
                <Text>#{l}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Suggestions */}
      <View style={styles.suggestions}>
        <Text style={styles.suggestionsTitle}>Try:</Text>
        <Text style={styles.suggestion}>"Buy milk tomorrow"</Text>
        <Text style={styles.suggestion}>"Call mom at 3pm !!"</Text>
        <Text style={styles.suggestion}>"Review PR #work"</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: {
    fontSize: 17,
    fontWeight: '600'
  },
  cancel: {
    color: '#6b7280'
  },
  done: {
    color: '#0ea5e9',
    fontWeight: '600'
  },
  disabled: {
    opacity: 0.5
  },
  input: {
    padding: 16,
    fontSize: 18,
    minHeight: 100
  },
  preview: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '500'
  },
  previewMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8
  },
  badge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  suggestions: {
    padding: 16
  },
  suggestionsTitle: {
    color: '#9ca3af',
    marginBottom: 8
  },
  suggestion: {
    color: '#6b7280',
    marginVertical: 2
  }
});
```

## Acceptance Criteria

1. [ ] Modal opens from FAB
2. [ ] Text input works
3. [ ] Parse preview shows
4. [ ] Submit creates task
5. [ ] Cancel dismisses modal
6. [ ] Keyboard avoidance works
