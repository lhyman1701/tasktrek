# Create Wave Command

Create a new wave with detailed task specifications.

## STEP ZERO: Read Architecture First (MANDATORY)

**Before creating ANY wave, you MUST read these files:**

```
1. .claude/PROJECT_CONTEXT.md     <- Full architecture, patterns, conventions
2. CLAUDE.md                       <- Tech stack, rules
3. Relevant existing code          <- Patterns to follow
```

**Why:** You cannot create architecturally-correct tasks without knowing:
- Directory structure and module ownership
- Coding standards
- Tech stack choices
- Database schemas and relationships
- API conventions

**After reading, you must be able to answer:**
- [ ] Which service owns this functionality?
- [ ] What directory do new files go in?
- [ ] What existing code should I reference as a pattern?
- [ ] What database tables/collections are involved?
- [ ] What are the logging/error handling conventions?

---

## CRITICAL: Context Preservation Rule

**Task specs MUST be created at wave creation time** when you have full context about:
- Why each task exists
- How it should be implemented
- What files to modify
- Acceptance criteria
- Dependencies

**DO NOT** create waves with only task IDs. Context will be lost between sessions.

---

## Wave Creation Workflow

### Step 1: Define Wave Scope

Before creating anything, understand:
1. What is the goal of this wave?
2. What tasks are needed to achieve it?
3. What are the dependencies between tasks?
4. What is the success criteria for the wave?

### Step 2: Create Task Specification Files

**For EACH task in the wave**, create a detailed spec file:

```
tasks/[WAVE-ID]/[TASK-ID].md
```

Example structure:
```
tasks/
├── WAVE-001/
│   ├── TASK-001-first-step.md
│   ├── TASK-002-second-step.md
│   ├── TASK-003-third-step.md
│   └── TASK-004-final-step.md
```

**Use template:** `.claude/templates/task-template.md`

**Required sections in each task file:**
- Purpose (why this task exists)
- Context (what implementer needs to know)
- Files to create/modify (specific paths)
- Implementation steps (concrete actions)
- Code patterns to follow (with references)
- Acceptance criteria (functional + technical)
- Dependencies (blocked by / blocks)
- Verification commands

### Step 3: Add Wave to .wave-config.json

Add the wave definition with:
- `id`, `name`, `description`
- `tasks` array with all task IDs
- `task_count`
- `depends_on` (other wave IDs)
- `phases` if multi-phase
- `task_definitions` with file paths to task specs
- `success_criteria`

Example:
```json
{
  "001": {
    "id": "001",
    "name": "Feature Implementation",
    "description": "Implement core feature",
    "tasks": ["TASK-001", "TASK-002", ...],
    "task_count": 4,
    "depends_on": [],
    "task_specs": {
      "TASK-001": "tasks/WAVE-001/TASK-001-first-step.md",
      "TASK-002": "tasks/WAVE-001/TASK-002-second-step.md"
    },
    "success_criteria": [...]
  }
}
```

### Step 4: Create Wave Progress File

Create `progress/wave-[ID]-status.md` with:
- Wave header and status
- Task table (ID, Description, Status, Notes)
- Progress counter
- Empty sections for files created/modified

### Step 5: Update Tracking Documents

1. Add wave to `docs/INCOMPLETE-WAVES-STATUS.md`
2. Update `SESSION_START.md` if this is the new active wave

---

## Task Spec Quality Checklist

Before finalizing wave creation, verify each task spec has:

- [ ] **Purpose** - Clear "why" (not just "what")
- [ ] **Context** - Background a new session would need
- [ ] **Specific files** - Exact paths, not "relevant files"
- [ ] **Code patterns** - Reference to existing code to follow
- [ ] **Acceptance criteria** - Testable, not vague
- [ ] **Verification commands** - Copy-paste ready

---

## Anti-Patterns (FORBIDDEN)

### Bad: Task ID Only
```json
"tasks": ["TASK-001", "TASK-002"]
// No specs - context will be lost!
```

### Bad: Vague Description
```markdown
## Purpose
Implement the feature.

## Files
- Relevant service files
- Test files
```

### Good: Detailed Spec
```markdown
## Purpose
Migrate CreateItem, UpdateItem, DeleteItem mutations from direct
service calls to command bus. This ensures all mutations
have audit trails and authorization re-checks at execution time.

## Files to Create
| File | Purpose |
|------|---------|
| `shared/commands/items/commands.py` | Pydantic command models |
| `shared/commands/items/handlers.py` | Handler implementations |

## Code Patterns to Follow
Follow the pattern from Wave 001 edits:
- Reference: `shared/commands/edits/commands.py:18-45`
- Use `@register_handler` decorator
- Include `origin_channel` in all commands
```

---

## Example Usage

```
User: Create a wave for implementing user notifications

Claude:
1. Analyzes notification requirements
2. Breaks into tasks (models, service, API, tests, etc.)
3. Creates tasks/WAVE-XXX/*.md files with full specs
4. Adds wave to .wave-config.json
5. Creates progress/wave-XXX-status.md
6. Updates docs/INCOMPLETE-WAVES-STATUS.md
```

---

## Related Commands

| Command | Purpose |
|---------|---------|
| `/wave-status` | View all waves |
| `/task-status [ID]` | View specific task |
| `/wave-next` | Start next unblocked wave |
| `/wave-validate` | Check wave system consistency |
