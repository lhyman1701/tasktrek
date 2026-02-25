# TaskTrek

A full-featured, stack-agnostic Claude Code project template with wave-based task management, session auditing, testing enforcement, and comprehensive slash commands.

## Features

- **Wave-Based Task Management**: Organize work into waves with tasks, dependencies, and progress tracking
- **Session Auditing via MCP**: Track actions, decisions, and task changes across sessions
- **Testing Enforcement Hooks**: Quality gates that ensure TDD, test classification, and regression prevention
- **23 Slash Commands**: Comprehensive commands for session management, wave control, testing, and deployment
- **User Condition Testing**: Built-in support for UC-NEW (new user) and UC-RET (returning user) test coverage

## Quick Start

### 1. Clone the Template

```bash
git clone https://github.com/lhyman1701/tasktrek.git my-project
cd my-project
```

### 2. Run the Init Script

```bash
./scripts/init-project.sh
```

This will prompt you for:
- Project name
- Project path
- Test commands
- Tech stack description

### 3. Build the MCP Server

```bash
cd mcp-servers/session-audit
npm install
npm run build
cd ../..
```

### 4. Configure Your Project

Edit `.claude/config.sh` with your project's test commands:

```bash
export TEST_COMMAND="npm test"
export E2E_COMMAND="npm run test:e2e"
export LINT_COMMAND="npm run lint"
```

### 5. Start Using TaskTrek

```bash
# Start a new session
/session-start

# Create a wave for your work
/create-wave

# Get the next task
/next-task

# End your session
/end-session
```

## Placeholder Reference

Replace these placeholders in template files:

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{{PROJECT_NAME}}` | "MyApp" | Your project name |
| `{{PROJECT_PATH}}` | "/Users/me/myapp" | Full path to project |
| `{{TEST_COMMAND}}` | "npm test" | Unit test command |
| `{{E2E_COMMAND}}` | "npm run test:e2e" | E2E test command |
| `{{LINT_COMMAND}}` | "npm run lint" | Linting command |
| `{{TYPECHECK_COMMAND}}` | "npm run typecheck" | Type checking command |
| `{{TECH_STACK}}` | "React + Node" | Your tech stack |
| `{{PROJECT_DESCRIPTION}}` | "A web app for..." | Brief description |

## Directory Structure

```
tasktrek/
├── CLAUDE.md                    # Project rules for Claude Code
├── SESSION_START.md             # Current session state
├── .wave-config.json            # Wave definitions
│
├── .claude/
│   ├── settings.json            # Hooks, MCP, permissions
│   ├── config.sh.template       # Test command configuration
│   ├── PROJECT_CONTEXT.md       # Full architecture
│   │
│   ├── commands/                # 23 slash commands
│   ├── hooks/                   # 15 quality enforcement hooks
│   ├── prompts/                 # 10 guidance prompts
│   ├── rules/                   # 4 policy files
│   ├── templates/               # Task and wave templates
│   ├── docs/                    # Protocol documentation
│   └── plans/                   # Project-local plans
│
├── mcp-servers/
│   └── session-audit/           # MCP server for session tracking
│
├── progress/                    # Wave progress files
├── tasks/                       # Task specifications
└── scripts/                     # Init and utility scripts
```

## Commands Reference

### Session Management

| Command | Description |
|---------|-------------|
| `/session-start` | Initialize session, read context |
| `/end-session` | Close session, update documentation |

### Wave Management

| Command | Description |
|---------|-------------|
| `/create-wave` | Create a new wave |
| `/wave-status` | Show current wave status |
| `/wave-dashboard` | Full wave dashboard |
| `/wave-next` | Get next available work |
| `/wave-validate` | Validate wave configuration |
| `/wave-log` | Show wave activity log |
| `/wave-threads` | Show parallel threads |

### Task Management

| Command | Description |
|---------|-------------|
| `/create-task` | Create a new task |
| `/task-status` | Show task status |
| `/next-task` | Get next task to work on |
| `/agent-status` | Show agent/worker status |

### Testing

| Command | Description |
|---------|-------------|
| `/baseline-test` | Snapshot current test state |
| `/test-audit` | Audit test coverage |
| `/e2e-verify [feature]` | EXHAUST verification protocol |
| `/investigate-failures` | Process test failures |

### Development

| Command | Description |
|---------|-------------|
| `/plan-first` | Mandatory planning before coding |
| `/commit-work` | Commit with quality checks |
| `/update-docs` | Update documentation |
| `/sync-incomplete-waves` | Sync wave status |

### Deployment

| Command | Description |
|---------|-------------|
| `/deploy` | Deploy to configured environment |
| `/deploy-status` | Check deployment status |

## Hooks

TaskTrek includes 15 quality enforcement hooks:

### Session Hooks
- `session-start.sh` - Initialize session context
- `session-start-testing.sh` - Load test credentials

### Pre-Edit Hooks
- `pre-edit-check.sh` - Verify alignment before edits
- `test-failure-classifier.sh` - Enforce failure classification
- `pre-commit-test-gate.sh` - Block commits if tests fail

### Post-Edit Hooks
- `post-edit-verify.sh` - Remind about testing
- `regression-detector.sh` - Warn about affected tests
- `post-write.sh` - Auto-format files

### Stop Hooks
- `on-stop.sh` - Save session state
- `stop-gate-testing.sh` - Warn about incomplete work

### Quality Hooks
- `quality-check.sh` - Run quality metrics
- `objective-check.sh` - Verify alignment with objectives
- `audit-condition-coverage.sh` - Check user conditions
- `verify-condition-coverage.sh` - Enforce condition testing
- `verify-test-completeness.sh` - Ensure complete coverage

## MCP Server

The session-audit MCP server provides:

### Tools

- `start_session` / `end_session` - Session lifecycle
- `log_action` / `log_decision` - Real-time logging
- `log_task_change` - Task state tracking
- `mark_incomplete` - Track incomplete work
- `search_actions` / `search_decisions` - Query history
- `get_incomplete_work` - Find pending items
- `get_session_context` - Get current state

### Database

SQLite database storing:
- Sessions
- Actions
- Decisions
- Task state changes
- Incomplete work

## Testing Protocol

TaskTrek enforces a rigorous testing protocol:

1. **TDD Mandatory**: Write tests before implementation
2. **Failure Classification**: Categorize failures as A (app), B (test), or C (environment)
3. **User Conditions**: Test both UC-NEW and UC-RET scenarios
4. **Content Assertions**: Assert actual values, not just visibility
5. **Evidence Required**: Show test output for completion claims

See `.claude/docs/TESTING-PROTOCOL.md` for full details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run the verification script
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
