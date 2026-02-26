# TASK-001: Initialize Monorepo with npm Workspaces

## Status: ready

## Description

Set up the monorepo structure using npm workspaces. This is the foundation for all other packages.

## Dependencies

None - this is the first task.

## Files to Create

```
tasktrek/
├── package.json              # Root package.json with workspaces
├── tsconfig.base.json        # Shared TypeScript config
├── .nvmrc                    # Node version (20)
├── .gitignore                # Updated gitignore
├── packages/
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       └── index.ts
│   ├── web/
│   │   └── .gitkeep
│   └── mobile/
│       └── .gitkeep
└── infra/
    └── .gitkeep
```

## Implementation Details

### Root package.json

```json
{
  "name": "taskflow",
  "private": true,
  "workspaces": ["packages/*", "infra"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

## Acceptance Criteria

1. [ ] Root package.json exists with workspaces configuration
2. [ ] `npm install` runs successfully from root
3. [ ] packages/api and packages/shared directories exist with package.json
4. [ ] TypeScript compiles without errors
5. [ ] Node version locked to 20+

## Verification

```bash
# From project root
npm install
npm run typecheck
```

## Notes

- Use `"type": "module"` in package.json for ESM
- Ensure packages can import from each other via workspace protocol
