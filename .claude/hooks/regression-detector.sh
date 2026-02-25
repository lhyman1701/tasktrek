#!/bin/bash
# PostToolUse hook for Write|Edit operations on source files
# Warns about related tests that should be run after source changes

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

# Skip if editing a test file
if echo "$FILE_PATH" | grep -qE '\.(test|spec)\.(ts|tsx|js|jsx|py)$'; then
    exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

# Only check for source code files
case "$EXT" in
    ts|tsx|js|jsx|py|go|rs|java)
        ;;
    *)
        exit 0
        ;;
esac

# Find related test files
BASENAME=$(basename "$FILE_PATH" | sed 's/\.[^.]*$//')
RELATED_TESTS=$(find . -path ./node_modules -prune -o \( -name "${BASENAME}.test.*" -o -name "${BASENAME}.spec.*" \) -print 2>/dev/null | head -5)

if [ -n "$RELATED_TESTS" ]; then
    echo "⚠️  Source file edited: $FILE_PATH"
    echo "   Related tests that may need to run:"
    echo "$RELATED_TESTS" | sed 's/^/   • /'
    echo ""
fi

# Check baseline if exists
if [ -f ".test-baseline.json" ]; then
    echo "💡 Test baseline active - run tests to catch regressions"
fi

exit 0
