#!/bin/bash
# TaskTrek Project Initialization Script
# Replaces all placeholders with project-specific values

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    TaskTrek Initialization                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Get project root (script is in scripts/ directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Prompt for project details
echo "Please provide your project details:"
echo ""

read -p "Project name (e.g., MyApp): " PROJECT_NAME
read -p "Project path (e.g., /Users/me/myapp) [$(pwd)]: " PROJECT_PATH
PROJECT_PATH="${PROJECT_PATH:-$(pwd)}"

read -p "Project description (one line): " PROJECT_DESCRIPTION

echo ""
echo "Tech stack (press Enter for defaults, or specify custom):"
read -p "Test command [npm test]: " TEST_COMMAND
TEST_COMMAND="${TEST_COMMAND:-npm test}"

read -p "E2E command [npm run test:e2e]: " E2E_COMMAND
E2E_COMMAND="${E2E_COMMAND:-npm run test:e2e}"

read -p "Lint command [npm run lint]: " LINT_COMMAND
LINT_COMMAND="${LINT_COMMAND:-npm run lint}"

read -p "Type check command [npm run typecheck]: " TYPECHECK_COMMAND
TYPECHECK_COMMAND="${TYPECHECK_COMMAND:-npm run typecheck}"

read -p "Tech stack description (e.g., React + Node): " TECH_STACK

echo ""
echo "Configuration:"
echo "  Project Name: $PROJECT_NAME"
echo "  Project Path: $PROJECT_PATH"
echo "  Description: $PROJECT_DESCRIPTION"
echo "  Test Command: $TEST_COMMAND"
echo "  E2E Command: $E2E_COMMAND"
echo "  Lint Command: $LINT_COMMAND"
echo "  Type Check: $TYPECHECK_COMMAND"
echo "  Tech Stack: $TECH_STACK"
echo ""

read -p "Proceed with initialization? (y/n): " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Initialization cancelled."
    exit 0
fi

echo ""
echo "Initializing project..."

# Create config.sh from template
echo "Creating .claude/config.sh..."
cp .claude/config.sh.template .claude/config.sh

# Replace placeholders in config.sh
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" .claude/config.sh
sed -i '' "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" .claude/config.sh
sed -i '' "s|npm test|$TEST_COMMAND|g" .claude/config.sh
sed -i '' "s|npm run test:e2e|$E2E_COMMAND|g" .claude/config.sh
sed -i '' "s|npm run lint|$LINT_COMMAND|g" .claude/config.sh
sed -i '' "s|npm run typecheck|$TYPECHECK_COMMAND|g" .claude/config.sh

# Replace placeholders in main files
echo "Updating CLAUDE.md..."
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" CLAUDE.md
sed -i '' "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" CLAUDE.md
sed -i '' "s|{{TEST_COMMAND}}|$TEST_COMMAND|g" CLAUDE.md
sed -i '' "s|{{E2E_COMMAND}}|$E2E_COMMAND|g" CLAUDE.md
sed -i '' "s|{{LINT_COMMAND}}|$LINT_COMMAND|g" CLAUDE.md
sed -i '' "s|{{TYPECHECK_COMMAND}}|$TYPECHECK_COMMAND|g" CLAUDE.md
sed -i '' "s|{{TECH_STACK}}|$TECH_STACK|g" CLAUDE.md

echo "Updating SESSION_START.md..."
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" SESSION_START.md
sed -i '' "s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION|g" SESSION_START.md
sed -i '' "s|{{DATE}}|$(date +%Y-%m-%d)|g" SESSION_START.md

echo "Updating .wave-config.json..."
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" .wave-config.json

echo "Updating .claude/PROJECT_CONTEXT.md..."
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{PROJECT_DESCRIPTION}}|$PROJECT_DESCRIPTION|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{TECH_STACK}}|$TECH_STACK|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{TEST_COMMAND}}|$TEST_COMMAND|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{E2E_COMMAND}}|$E2E_COMMAND|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{LINT_COMMAND}}|$LINT_COMMAND|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{TYPECHECK_COMMAND}}|$TYPECHECK_COMMAND|g" .claude/PROJECT_CONTEXT.md
sed -i '' "s|{{DATE}}|$(date +%Y-%m-%d)|g" .claude/PROJECT_CONTEXT.md

echo "Updating .claude/prompts/00-system.md..."
sed -i '' "s|{{PROJECT_NAME}}|$PROJECT_NAME|g" .claude/prompts/00-system.md
sed -i '' "s|{{PROJECT_PATH}}|$PROJECT_PATH|g" .claude/prompts/00-system.md

# Build MCP server
echo ""
echo "Building MCP server..."
cd mcp-servers/session-audit
if command -v npm &> /dev/null; then
    npm install
    npm run build
    echo "MCP server built successfully."
else
    echo "npm not found. Please run manually:"
    echo "  cd mcp-servers/session-audit && npm install && npm run build"
fi
cd "$PROJECT_ROOT"

# Make hooks executable
echo ""
echo "Making hooks executable..."
chmod +x .claude/hooks/*.sh

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                   Initialization Complete!                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Review the generated files"
echo "  2. Update any remaining placeholders"
echo "  3. Start a session with /session-start"
echo ""
echo "Key files:"
echo "  - CLAUDE.md: Project rules"
echo "  - SESSION_START.md: Current session state"
echo "  - .claude/config.sh: Test commands"
echo ""
