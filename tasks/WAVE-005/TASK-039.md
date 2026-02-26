# TASK-039: Design App Icon and Splash Screen

## Status: blocked

## Dependencies

- WAVE-003, WAVE-004 complete

## Description

Create app icon, splash screen, and favicon for all platforms.

## Deliverables

### App Icon
- iOS: 1024x1024 master, generated sizes
- Web: favicon.ico, apple-touch-icon.png
- Design: Checkmark in gradient circle

### Splash Screen
- iOS: Various sizes per Expo requirements
- Web: Loading spinner with logo
- Design: Logo centered on brand color background

## Files to Create

```
packages/mobile/assets/
├── icon.png              # 1024x1024
├── adaptive-icon.png     # 1024x1024 (Android)
├── splash.png            # 1284x2778
└── notification-icon.png # 96x96

packages/web/public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png  # 180x180
└── icon-192.png
└── icon-512.png
```

## Design Specifications

### Icon Design

```
- Background: Linear gradient (#0ea5e9 → #3b82f6)
- Foreground: White checkmark symbol
- Border radius: iOS standard (auto-applied)
- Safe area: 20% margin for adaptive icon
```

### Splash Screen

```
- Background: #0ea5e9 (primary)
- Logo: White TaskFlow logo centered
- Animation: Fade out to app (via expo-splash-screen)
```

## Implementation

### Splash Screen Control

```typescript
// packages/mobile/App.tsx
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      // Load fonts, fetch initial data
      await loadFonts();
      await prefetchData();
      setAppReady(true);
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;

  return (
    <View onLayout={onLayoutRootView}>
      <RootNavigator />
    </View>
  );
}
```

### Web Favicon Setup

```html
<!-- packages/web/index.html -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#0ea5e9">
```

## Acceptance Criteria

1. [ ] Icon displays on iOS home screen
2. [ ] Icon shows in App Store correctly
3. [ ] Splash screen shows on launch
4. [ ] Splash fades to app smoothly
5. [ ] Favicon shows in browser tab
6. [ ] Apple touch icon works

## Tools

- Figma for design
- expo-splash-screen for control
- ape-tools or similar for icon generation
