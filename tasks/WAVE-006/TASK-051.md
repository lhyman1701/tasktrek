# TASK-051: Weekly AI Reports

## Status: blocked

## Dependencies

- WAVE-005 complete

## Description

Generate weekly productivity reports using AI analysis.

## Report Contents

1. **Summary Stats**
   - Tasks completed
   - Tasks created
   - Completion rate
   - Most productive day

2. **Analysis**
   - Patterns identified
   - Suggestions for improvement
   - Project progress

3. **Next Week**
   - Upcoming deadlines
   - Recommended priorities

## Implementation

### Report Generation Service

```typescript
// services/reportService.ts
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../db/client';
import { startOfWeek, endOfWeek, subWeeks } from 'date-fns';

const anthropic = new Anthropic();

interface WeeklyReport {
  period: { start: Date; end: Date };
  stats: {
    tasksCreated: number;
    tasksCompleted: number;
    completionRate: number;
    mostProductiveDay: string;
    avgTasksPerDay: number;
  };
  projectBreakdown: Array<{
    project: string;
    completed: number;
    pending: number;
  }>;
  analysis: string;
  suggestions: string[];
  upcomingDeadlines: Array<{
    content: string;
    dueDate: string;
    priority: number;
  }>;
}

export async function generateWeeklyReport(userId: string): Promise<WeeklyReport> {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const lastWeekStart = startOfWeek(subWeeks(now, 1));

  // Fetch data
  const [
    tasksCreatedThisWeek,
    tasksCompletedThisWeek,
    tasksCompletedLastWeek,
    tasksByDay,
    projectStats,
    upcomingTasks
  ] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        createdAt: { gte: weekStart, lte: weekEnd }
      }
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: true,
        updatedAt: { gte: weekStart, lte: weekEnd }
      }
    }),
    prisma.task.count({
      where: {
        userId,
        isCompleted: true,
        updatedAt: { gte: lastWeekStart, lte: weekStart }
      }
    }),
    getTasksByDayOfWeek(userId, weekStart, weekEnd),
    getProjectStats(userId, weekStart, weekEnd),
    prisma.task.findMany({
      where: {
        userId,
        isCompleted: false,
        dueDate: { gte: now, lte: addWeeks(now, 1) }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })
  ]);

  // Find most productive day
  const mostProductiveDay = Object.entries(tasksByDay)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  // Calculate completion rate
  const totalTasks = tasksCreatedThisWeek + /* existing incomplete from before */;
  const completionRate = totalTasks > 0
    ? Math.round((tasksCompletedThisWeek / totalTasks) * 100)
    : 0;

  // Generate AI analysis
  const analysisPrompt = `
    Analyze this weekly productivity data and provide insights:

    Tasks Created: ${tasksCreatedThisWeek}
    Tasks Completed: ${tasksCompletedThisWeek}
    Last Week Completed: ${tasksCompletedLastWeek}
    Most Productive Day: ${mostProductiveDay}
    Completion Rate: ${completionRate}%

    Project Breakdown:
    ${projectStats.map(p => `- ${p.project}: ${p.completed} completed, ${p.pending} pending`).join('\n')}

    Provide:
    1. A brief 2-3 sentence analysis
    2. 2-3 specific, actionable suggestions

    Format as JSON: { "analysis": "...", "suggestions": ["...", "..."] }
  `;

  const aiResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [{ role: 'user', content: analysisPrompt }]
  });

  const aiContent = aiResponse.content[0];
  const { analysis, suggestions } = JSON.parse(aiContent.text);

  return {
    period: { start: weekStart, end: weekEnd },
    stats: {
      tasksCreated: tasksCreatedThisWeek,
      tasksCompleted: tasksCompletedThisWeek,
      completionRate,
      mostProductiveDay,
      avgTasksPerDay: Math.round(tasksCompletedThisWeek / 7 * 10) / 10
    },
    projectBreakdown: projectStats,
    analysis,
    suggestions,
    upcomingDeadlines: upcomingTasks.map(t => ({
      content: t.content,
      dueDate: t.dueDate!.toISOString(),
      priority: t.priority
    }))
  };
}
```

### API Endpoint

```typescript
// routes/reports.ts
router.get('/weekly', async (req, res) => {
  const report = await generateWeeklyReport(req.user!.id);
  res.json(report);
});

router.post('/weekly/email', async (req, res) => {
  const report = await generateWeeklyReport(req.user!.id);
  await sendReportEmail(req.user!.email, report);
  res.json({ sent: true });
});
```

### Scheduled Job

```typescript
// jobs/weeklyReport.ts
import { CronJob } from 'cron';

// Run every Sunday at 6 PM
const job = new CronJob('0 18 * * 0', async () => {
  const users = await prisma.user.findMany({
    where: { weeklyReportEnabled: true }
  });

  for (const user of users) {
    const report = await generateWeeklyReport(user.id);
    await sendReportEmail(user.email, report);
  }
});

job.start();
```

## UI Component

```typescript
// components/WeeklyReport.tsx
export function WeeklyReport() {
  const { data: report, isLoading } = useWeeklyReport();

  if (isLoading) return <ReportSkeleton />;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Weekly Report</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Completed"
          value={report.stats.tasksCompleted}
          icon={<CheckIcon />}
        />
        <StatCard
          title="Created"
          value={report.stats.tasksCreated}
          icon={<PlusIcon />}
        />
        <StatCard
          title="Completion Rate"
          value={`${report.stats.completionRate}%`}
          icon={<ChartIcon />}
        />
        <StatCard
          title="Best Day"
          value={report.stats.mostProductiveDay}
          icon={<TrophyIcon />}
        />
      </div>

      {/* Analysis */}
      <Card>
        <h2 className="font-semibold mb-2">AI Analysis</h2>
        <p>{report.analysis}</p>
      </Card>

      {/* Suggestions */}
      <Card>
        <h2 className="font-semibold mb-2">Suggestions</h2>
        <ul className="list-disc pl-4 space-y-1">
          {report.suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>

      {/* Upcoming */}
      <Card>
        <h2 className="font-semibold mb-2">Upcoming Deadlines</h2>
        {report.upcomingDeadlines.map(task => (
          <div key={task.content} className="flex justify-between py-2">
            <span>{task.content}</span>
            <span className="text-gray-500">{formatDate(task.dueDate)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
```

## Acceptance Criteria

1. [ ] Stats calculated correctly
2. [ ] AI analysis is insightful
3. [ ] Suggestions are actionable
4. [ ] Upcoming deadlines shown
5. [ ] Email delivery works
6. [ ] Scheduled job runs weekly
