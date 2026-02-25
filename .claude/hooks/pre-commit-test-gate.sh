#!/bin/bash
# PreToolUse hook for Bash(git commit*) and Bash(git push*)
# Blocks commits/pushes if tests are failing

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Check for test-failures.json
if [ -f "test-failures.json" ]; then
    UNINVESTIGATED=$(python3 -c "
import json
try:
    with open('test-failures.json') as f:
        data = json.load(f)
    total = data.get('total', 0)
    investigated = data.get('investigated', 0)
    print(total - investigated)
except:
    print(0)
" 2>/dev/null)

    if [ "$UNINVESTIGATED" -gt 0 ]; then
        echo "❌ BLOCKED: $UNINVESTIGATED uninvestigated test failures"
        echo ""
        echo "Run /investigate-failures to classify and fix before committing."
        echo ""
        exit 1
    fi
fi

# Run tests if TEST_COMMAND is configured
if [ -n "${TEST_COMMAND:-}" ]; then
    echo "🧪 Running tests before commit..."
    if ! eval "$TEST_COMMAND" > /tmp/test-output.txt 2>&1; then
        echo "❌ BLOCKED: Tests are failing"
        echo ""
        tail -20 /tmp/test-output.txt
        echo ""
        echo "Fix failing tests before committing."
        exit 1
    fi
    echo "✅ Tests passed"
fi

exit 0
