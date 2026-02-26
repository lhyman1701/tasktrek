# TASK-042: TestFlight Build and Testing

## Status: blocked

## Dependencies

- TASK-039, TASK-040

## Description

Set up EAS Build and deploy to TestFlight for beta testing.

## Setup

### eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789"
      }
    }
  }
}
```

### App Store Connect Setup

1. Create App ID in Developer Portal
2. Create App in App Store Connect
3. Generate App-Specific Password
4. Set up EAS credentials

## Build Commands

```bash
# First time setup
eas login
eas build:configure

# Development build (for simulator)
eas build --profile development --platform ios

# Preview build (for TestFlight)
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios

# Submit to TestFlight
eas submit --platform ios --latest
```

## Testing Checklist

### Functionality
- [ ] App launches correctly
- [ ] All tabs navigate properly
- [ ] Task CRUD operations work
- [ ] Quick add with NLP works
- [ ] AI chat works
- [ ] Push notifications received
- [ ] Offline mode works
- [ ] Sync works when back online

### UI/UX
- [ ] All screens render correctly
- [ ] Dark mode works
- [ ] Fonts load properly
- [ ] Icons display correctly
- [ ] Animations are smooth
- [ ] No layout issues

### Performance
- [ ] App starts quickly (< 3s)
- [ ] Lists scroll smoothly
- [ ] No memory leaks
- [ ] Battery usage reasonable

### Edge Cases
- [ ] Empty states display
- [ ] Error handling works
- [ ] Network timeout handling
- [ ] Large task lists (100+)

## TestFlight Distribution

```bash
# Submit build to TestFlight
eas submit --platform ios

# Or submit specific build
eas submit --platform ios --id <build-id>
```

### TestFlight Testing Groups

1. **Internal Testers** (Apple team members)
   - Automatic access
   - No review required

2. **External Testers** (Beta users)
   - Requires Beta App Review
   - Add emails in App Store Connect
   - Max 10,000 testers

## Acceptance Criteria

1. [ ] EAS Build configured
2. [ ] Development build works
3. [ ] Preview build uploads to TestFlight
4. [ ] Internal testers can install
5. [ ] Beta App Review approved
6. [ ] External testers can install
7. [ ] Crash reporting works (Sentry/Expo)
8. [ ] All checklist items verified
