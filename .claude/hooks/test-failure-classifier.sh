#!/bin/bash
# PreToolUse hook for Edit operations on test files
# Blocks test file edits without proper failure classification

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Read input from Claude
INPUT=$(cat)

# Extract file path from tool input
FILE_PATH=$(echo "$INPUT" | python3 -c "
import json
import sys
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    pass
" 2>/dev/null)

if [ -z "$FILE_PATH" ]; then
    exit 0
fi

# Only check test files
if ! echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx|py)$'; then
    exit 0
fi

# Check if test-failures.json exists and has entries
if [ -f "test-failures.json" ]; then
    # Check if this file has a classified failure
    CLASSIFIED=$(python3 -c "
import json
import sys
try:
    with open('test-failures.json') as f:
        data = json.load(f)
    filepath = '$FILE_PATH'
    for failure in data.get('failures', []):
        if failure.get('file', '').endswith(filepath.split('/')[-1]):
            category = failure.get('category')
            if category:
                print(f'CLASSIFIED:{category}')
                sys.exit(0)
            else:
                print('UNCLASSIFIED')
                sys.exit(0)
    print('NOT_TRACKED')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null)

    if echo "$CLASSIFIED" | grep -q "^UNCLASSIFIED"; then
        echo "❌ BLOCKED: Test file edit requires classification"
        echo ""
        echo "This test file has failures that haven't been classified."
        echo ""
        echo "Before editing, classify the failure:"
        echo "  A = App bug (test correct, fix the app)"
        echo "  B = Test bug (app correct, fix the test)"
        echo "  C = Environment issue (fix config/setup)"
        echo ""
        echo "Run /investigate-failures to classify properly."
        exit 1
    fi

    if echo "$CLASSIFIED" | grep -q "^CLASSIFIED:A"; then
        echo "⚠️  WARNING: This test is classified as A (app bug)"
        echo "   You should be editing the APP code, not the test."
        echo "   If this classification is wrong, update test-failures.json"
    fi
fi

exit 0
