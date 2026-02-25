#!/bin/bash
# Stop hook: Enhanced state save before Claude stops
# Saves session state and warns about uncommitted changes

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Update SESSION_START.md with session end time
if [ -f "SESSION_START.md" ]; then
    echo "" >> SESSION_START.md
    echo "---" >> SESSION_START.md
    echo "**Session ended:** $TIMESTAMP" >> SESSION_START.md
    echo "" >> SESSION_START.md
fi

# Log session end to MCP audit if possible
# (MCP server handles its own logging, this is just a marker)
mkdir -p .claude/logs
echo "[$TIMESTAMP] Session ended" >> .claude/logs/sessions.log

# Check for uncommitted changes
if git status --porcelain 2>/dev/null | grep -q '^'; then
    echo ""
    echo "⚠️  UNCOMMITTED CHANGES DETECTED"
    echo "   Run /commit-work or /end-session to commit changes"
    echo ""
    git status --short
    echo ""
fi

# Check for incomplete work in MCP audit
# This is informational only - actual tracking is in MCP server
echo "💡 TIP: Run /end-session to properly close session and update docs"

exit 0
