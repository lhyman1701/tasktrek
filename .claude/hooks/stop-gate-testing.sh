#!/bin/bash
# Stop hook: Prevents declaring completion while failures remain
# Part of testing enforcement system

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Check for uninvestigated failures
if [ -f "test-failures.json" ]; then
    STATS=$(python3 -c "
import json
try:
    with open('test-failures.json') as f:
        data = json.load(f)
    total = data.get('total', 0)
    investigated = data.get('investigated', 0)
    fixed = data.get('fixed', 0)

    if total > investigated:
        print(f'UNINVESTIGATED:{total - investigated}')
    elif total > fixed:
        print(f'UNFIXED:{total - fixed}')
    else:
        print('OK')
except:
    print('OK')
" 2>/dev/null)

    if echo "$STATS" | grep -q "^UNINVESTIGATED:"; then
        COUNT=$(echo "$STATS" | cut -d: -f2)
        echo ""
        echo "⚠️  WARNING: $COUNT test failures remain uninvestigated"
        echo "   Run /investigate-failures before ending session"
        echo ""
    fi

    if echo "$STATS" | grep -q "^UNFIXED:"; then
        COUNT=$(echo "$STATS" | cut -d: -f2)
        echo ""
        echo "⚠️  WARNING: $COUNT test failures investigated but not fixed"
        echo "   Document in session notes if deferring"
        echo ""
    fi
fi

# Check for uncommitted changes
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
    echo ""
    echo "⚠️  WARNING: $CHANGES uncommitted changes"
    echo "   Run /commit-work before ending session"
    echo ""
fi

exit 0
