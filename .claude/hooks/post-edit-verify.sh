#!/bin/bash
# PostToolUse hook for Write|Edit operations
# Reminds Claude to verify changes work correctly

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Read input from Claude (contains tool_input with file_path)
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

# Get file extension
EXT="${FILE_PATH##*.}"

# Remind about testing for code files
case "$EXT" in
    ts|tsx|js|jsx|py|go|rs|java)
        echo "💡 Code edited: Consider running tests to verify changes"
        ;;
    test.ts|test.tsx|test.js|spec.ts|spec.tsx|spec.js)
        echo "💡 Test edited: Run this test to verify it works"
        ;;
esac

exit 0
