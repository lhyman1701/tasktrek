# TASK-030: Initialize Expo Project

## Status: blocked

## Dependencies

- WAVE-002 complete

## Description

Set up the mobile package with Expo and TypeScript.

## Files to Create

```
packages/mobile/
├── package.json
├── tsconfig.json
├── app.json
├── babel.config.js
├── metro.config.js
├── App.tsx
└── src/
    ├── app/
    │   └── _layout.tsx
    └── components/
```

## Implementation

### app.json

```json
{
  "expo": {
    "name": "TaskFlow",
    "slug": "taskflow",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.taskflow.app",
      "infoPlist": {
        "UIBackgroundModes": ["remote-notification"]
      }
    },
    "plugins": [
      "expo-router",
      "expo-secure-store"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "scheme": "taskflow"
  }
}
```

### package.json

```json
{
  "name": "@taskflow/mobile",
  "version": "1.0.0",
  "main": "expo-router/entry",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "build:ios": "eas build --platform ios",
    "submit:ios": "eas submit --platform ios"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "expo-router": "~3.4.0",
    "expo-secure-store": "~12.8.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@tanstack/react-query": "^5.0.0"
  }
}
```

### metro.config.js (for monorepo)

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules')
];

module.exports = config;
```

## Acceptance Criteria

1. [ ] Expo project initializes
2. [ ] TypeScript compiles
3. [ ] App runs on iOS simulator
4. [ ] Monorepo imports work
5. [ ] expo-router configured
6. [ ] Typed routes work
