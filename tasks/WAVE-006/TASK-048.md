# TASK-048: Habit Tracker

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Add habit tracking with streaks and completion history.

## Database Schema

```prisma
model Habit {
  id          String   @id @default(uuid())
  name        String
  description String?
  frequency   String   // daily, weekly, custom
  targetDays  Int[]    // [0-6] for specific weekdays
  color       String   @default("blue")
  icon        String   @default("check")
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User           @relation(fields: [userId], references: [id])
  completions HabitCompletion[]

  @@index([userId])
}

model HabitCompletion {
  id        String   @id @default(uuid())
  habitId   String
  date      DateTime @db.Date
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@index([habitId])
}
```

## Implementation

```typescript
// components/HabitCard.tsx
interface HabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];
}

export function HabitCard({ habit, completions }: HabitCardProps) {
  const today = startOfDay(new Date());
  const isCompletedToday = completions.some(c =>
    isSameDay(new Date(c.date), today)
  );

  const streak = calculateStreak(habit, completions);
  const last7Days = getLast7Days();

  const toggleCompletion = useToggleHabitCompletion();

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: habit.color + '20' }}
          >
            <span style={{ color: habit.color }}>{habit.icon}</span>
          </div>
          <div>
            <h3 className="font-medium">{habit.name}</h3>
            <p className="text-sm text-gray-500">
              {streak} day streak 🔥
            </p>
          </div>
        </div>

        <button
          onClick={() => toggleCompletion.mutate({
            habitId: habit.id,
            date: today.toISOString()
          })}
          className={cn(
            'w-8 h-8 rounded-full border-2',
            isCompletedToday
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300'
          )}
        >
          {isCompletedToday && <CheckIcon className="w-4 h-4 text-white" />}
        </button>
      </div>

      {/* Last 7 days */}
      <div className="flex gap-1 mt-4">
        {last7Days.map(day => {
          const completed = completions.some(c =>
            isSameDay(new Date(c.date), day)
          );
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'w-8 h-8 rounded-md flex items-center justify-center text-xs',
                completed ? 'bg-green-100 text-green-700' : 'bg-gray-100',
                isToday(day) && 'ring-2 ring-primary-500'
              )}
            >
              {format(day, 'E')[0]}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function calculateStreak(habit: Habit, completions: HabitCompletion[]): number {
  let streak = 0;
  let currentDate = startOfDay(new Date());

  // Check if today is completed, if not start from yesterday
  const todayCompleted = completions.some(c =>
    isSameDay(new Date(c.date), currentDate)
  );

  if (!todayCompleted) {
    currentDate = subDays(currentDate, 1);
  }

  while (true) {
    const completed = completions.some(c =>
      isSameDay(new Date(c.date), currentDate)
    );

    if (!completed) break;

    streak++;
    currentDate = subDays(currentDate, 1);
  }

  return streak;
}
```

## API Endpoints

```typescript
// routes/habits.ts
router.get('/', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id },
    include: {
      completions: {
        where: {
          date: { gte: subDays(new Date(), 30) }
        }
      }
    }
  });
  res.json(habits);
});

router.post('/:id/toggle', async (req, res) => {
  const { id } = req.params;
  const date = startOfDay(new Date(req.body.date));

  const existing = await prisma.habitCompletion.findUnique({
    where: { habitId_date: { habitId: id, date } }
  });

  if (existing) {
    await prisma.habitCompletion.delete({ where: { id: existing.id } });
  } else {
    await prisma.habitCompletion.create({
      data: { habitId: id, date }
    });
  }

  res.json({ toggled: !existing });
});
```

## Acceptance Criteria

1. [ ] Create habits with frequency
2. [ ] Toggle daily completion
3. [ ] Streak calculation correct
4. [ ] Last 7 days visualization
5. [ ] Monthly view/calendar
6. [ ] Habit statistics
