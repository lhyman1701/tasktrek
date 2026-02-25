#!/bin/bash
# PostToolUse hook for Write|Edit operations
# Auto-formats files after Claude edits them

set -e

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

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
    exit 0
fi

# Get file extension
EXT="${FILE_PATH##*.}"

# Format based on file type
case "$EXT" in
    py)
        # Python: Try ruff (preferred), fallback to black
        if command -v ruff &> /dev/null; then
            ruff format "$FILE_PATH" 2>/dev/null || true
            ruff check --fix "$FILE_PATH" 2>/dev/null || true
        elif command -v black &> /dev/null; then
            black "$FILE_PATH" 2>/dev/null || true
        fi
        ;;
    ts|tsx|js|jsx)
        # TypeScript/JavaScript: prettier
        if command -v npx &> /dev/null; then
            npx prettier --write "$FILE_PATH" 2>/dev/null || true
        fi
        ;;
    json|yaml|yml|md)
        # Config files: prettier
        if command -v npx &> /dev/null; then
            npx prettier --write "$FILE_PATH" 2>/dev/null || true
        fi
        ;;
esac

exit 0
