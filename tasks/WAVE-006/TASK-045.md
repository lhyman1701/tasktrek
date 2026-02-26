# TASK-045: Pomodoro Timer

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Add Pomodoro timer for focused work sessions.

## Features

- 25 min work / 5 min break cycle
- Long break after 4 pomodoros
- Associate timer with task
- Track completed pomodoros
- Sound/notification on complete

## Implementation

```typescript
// components/PomodoroTimer.tsx
import { useState, useEffect, useRef } from 'react';

interface PomodoroTimerProps {
  taskId?: string;
  onComplete?: (type: 'work' | 'break') => void;
}

const WORK_DURATION = 25 * 60; // 25 minutes
const SHORT_BREAK = 5 * 60;
const LONG_BREAK = 15 * 60;

export function PomodoroTimer({ taskId, onComplete }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    audioRef.current?.play();

    if (mode === 'work') {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);
      onComplete?.('work');

      if (newCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
      onComplete?.('break');
    }

    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work'
    ? (WORK_DURATION - timeLeft) / WORK_DURATION
    : mode === 'shortBreak'
    ? (SHORT_BREAK - timeLeft) / SHORT_BREAK
    : (LONG_BREAK - timeLeft) / LONG_BREAK;

  return (
    <div className="flex flex-col items-center p-6">
      {/* Progress ring */}
      <div className="relative w-48 h-48">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="96" cy="96" r="88"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          <circle
            cx="96" cy="96" r="88"
            fill="none"
            stroke={mode === 'work' ? '#ef4444' : '#22c55e'}
            strokeWidth="8"
            strokeDasharray={553}
            strokeDashoffset={553 * (1 - progress)}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-mono">{formatTime(timeLeft)}</span>
          <span className="text-sm text-gray-500 capitalize">{mode}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg"
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => {
            setIsRunning(false);
            setTimeLeft(WORK_DURATION);
            setMode('work');
          }}
          className="px-6 py-2 bg-gray-200 rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Pomodoro count */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={cn(
              'w-3 h-3 rounded-full',
              i <= completedPomodoros % 4 || (completedPomodoros >= 4 && i <= 4)
                ? 'bg-red-500'
                : 'bg-gray-200'
            )}
          />
        ))}
      </div>

      <audio ref={audioRef} src="/sounds/bell.mp3" />
    </div>
  );
}
```

## Database Changes

```prisma
model Task {
  // ... existing fields
  pomodorosCompleted Int @default(0)
}
```

## Acceptance Criteria

1. [ ] Timer counts down
2. [ ] Work/break cycles alternate
3. [ ] Long break after 4 pomodoros
4. [ ] Sound plays on complete
5. [ ] Timer can be paused/reset
6. [ ] Pomodoros tracked per task
