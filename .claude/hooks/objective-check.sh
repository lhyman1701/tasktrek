#!/bin/bash
# PreToolUse hook for Write|Edit operations
# Reminds Claude to verify objective alignment before editing files

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Only show reminder if OBJECTIVES.md exists
if [ -f "OBJECTIVES.md" ]; then
    echo "⚠️  REMINDER: Does this align with OBJECTIVES.md?"
    # Extract first line of objectives as reminder
    FIRST_OBJECTIVE=$(grep -m1 "^-\|^•\|^1\." OBJECTIVES.md 2>/dev/null | head -1)
    if [ -n "$FIRST_OBJECTIVE" ]; then
        echo "   Primary: $FIRST_OBJECTIVE"
    fi
fi

exit 0
