# TASK-018: Configure TailwindCSS + Design System

## Status: blocked

## Dependencies

- TASK-017: Vite + React setup

## Description

Set up TailwindCSS with a custom design system for TaskFlow.

## Files to Create

```
packages/web/
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── index.css
    └── components/
        └── ui/
            ├── Button.tsx
            ├── Input.tsx
            ├── Card.tsx
            └── index.ts
```

## Design Tokens

```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1'
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#1e1e1e'
        },
        priority: {
          p1: '#dc2626',
          p2: '#f59e0b',
          p3: '#3b82f6',
          p4: '#6b7280'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

## Base Components

```typescript
// components/ui/Button.tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium transition-colors',
        {
          'bg-primary-600 text-white hover:bg-primary-700': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'hover:bg-gray-100': variant === 'ghost'
        },
        {
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg'
        },
        className
      )}
      {...props}
    />
  );
}
```

## Acceptance Criteria

1. [ ] TailwindCSS compiles
2. [ ] Custom colors available
3. [ ] Dark mode works
4. [ ] Base UI components created
5. [ ] Font loaded (Inter)
