# TASK-043: App Store Submission + Privacy Policy

## Status: blocked

## Dependencies

- TASK-042

## Description

Prepare and submit app to App Store, including privacy policy.

## App Store Listing

### Screenshots (Required)
- iPhone 6.7" (1290 x 2796)
- iPhone 6.5" (1284 x 2778)
- iPhone 5.5" (1242 x 2208)
- iPad Pro 12.9" (2048 x 2732)

### App Information
```
Name: TaskFlow - AI Task Manager
Subtitle: Smart Tasks with Natural Language
Category: Productivity
Price: Free
```

### Description
```
TaskFlow is your AI-powered task manager that understands natural language.

NATURAL LANGUAGE INPUT
Just type naturally: "Buy milk tomorrow at 3pm" and TaskFlow extracts the task, due date, and time automatically.

AI CHAT ASSISTANT
Chat with AI to manage your tasks:
• "Show me overdue tasks"
• "Complete the milk task"
• "Move all shopping tasks to Saturday"

SMART ORGANIZATION
• Inbox, Today, and Upcoming views
• Projects and labels for organization
• Priority levels (P1-P4)
• Recurring tasks

CROSS-PLATFORM
• iOS app with push notifications
• Web app at taskflow.app
• Syncs instantly across devices

Privacy-focused: Your data is encrypted and never sold.
```

### Keywords
```
task, todo, productivity, ai, natural language, gtd, tasks, reminder
```

## Privacy Policy Page

### Create Web Page

```typescript
// packages/web/src/pages/privacy.tsx
export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1>Privacy Policy</h1>
      <p>Last updated: {date}</p>

      <h2>Information We Collect</h2>
      <p>TaskFlow collects the following data:</p>
      <ul>
        <li>Email address (for account creation)</li>
        <li>Tasks, projects, and labels you create</li>
        <li>Device tokens (for push notifications)</li>
      </ul>

      <h2>How We Use Your Data</h2>
      <p>We use your data to:</p>
      <ul>
        <li>Provide the TaskFlow service</li>
        <li>Send push notification reminders</li>
        <li>Process your tasks with AI features</li>
      </ul>

      <h2>AI Processing</h2>
      <p>
        TaskFlow uses Claude AI to parse natural language and provide
        chat features. Your task content is processed by Anthropic's API
        but is not used to train AI models.
      </p>

      <h2>Data Storage</h2>
      <p>
        Your data is stored securely on AWS servers in the United States.
        All data is encrypted in transit and at rest.
      </p>

      <h2>Data Retention</h2>
      <p>
        We retain your data as long as your account is active.
        You can delete your account and all associated data at any time.
      </p>

      <h2>Contact</h2>
      <p>
        For privacy questions, contact: privacy@taskflow.app
      </p>
    </div>
  );
}
```

### Deploy Privacy Page
- Deploy to https://taskflow.app/privacy
- Link from App Store listing
- Link from Settings screen

## App Store Connect Checklist

### App Privacy
- Data types collected: Email, User Content
- Data linked to user: Yes
- Data used for tracking: No

### App Review Information
- Demo account credentials
- Contact information
- Notes for reviewer

### Version Release
- Manual release after review
- Or automatic release

## Submission Commands

```bash
# Build production release
eas build --profile production --platform ios

# Submit to App Store
eas submit --platform ios --latest
```

## Acceptance Criteria

1. [ ] All screenshots uploaded
2. [ ] App description complete
3. [ ] Privacy policy page live
4. [ ] Privacy declarations accurate
5. [ ] Demo account ready for review
6. [ ] App submitted successfully
7. [ ] App Review approved
8. [ ] App available on App Store
