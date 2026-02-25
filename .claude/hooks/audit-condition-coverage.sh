#!/bin/bash
# Audits test directory for user condition coverage

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

TEST_DIR="${1:-${E2E_DIR:-e2e}}"

echo "=== User Condition Coverage Audit ==="
echo "Directory: $TEST_DIR"
echo ""

TOTAL_FILES=0
NEW_USER_ONLY=0
HAS_RETURNING_USER=0

for file in $(find "$TEST_DIR" -name "*.spec.ts" -o -name "*.test.ts" 2>/dev/null); do
  TOTAL_FILES=$((TOTAL_FILES + 1))

  # Check for condition indicators
  NEW_USER=$(grep -ciE "create|new.?user|empty|sendMessage|\.fill\(" "$file" 2>/dev/null || echo 0)
  RETURNING=$(grep -ciE "returning|existing|already|previous|UC-RET|getConversation.*Has" "$file" 2>/dev/null || echo 0)

  if [ "$NEW_USER" -gt 0 ] && [ "$RETURNING" -eq 0 ]; then
    NEW_USER_ONLY=$((NEW_USER_ONLY + 1))
    echo "⚠️  $file: Only 'new user' condition"
  elif [ "$RETURNING" -gt 0 ]; then
    HAS_RETURNING_USER=$((HAS_RETURNING_USER + 1))
    echo "✓ $file: Has 'returning user' condition tests"
  else
    echo "? $file: Unable to determine conditions"
  fi
done

echo ""
echo "=== Summary ==="
echo "Total test files: $TOTAL_FILES"
echo "Only 'new user' condition: $NEW_USER_ONLY"
echo "Has 'returning user' condition: $HAS_RETURNING_USER"

if [ "$TOTAL_FILES" -gt 0 ]; then
  MISSING_PERCENT=$((NEW_USER_ONLY * 100 / TOTAL_FILES))
  echo "Files missing 'returning user' tests: ${MISSING_PERCENT}%"

  if [ "$MISSING_PERCENT" -gt 50 ]; then
    echo ""
    echo "CRITICAL: Most test files only cover 'new user' condition"
    echo "   The 'returning user with existing data' condition is undertested"
    echo "   Bugs in this condition will not be caught"
    echo ""
    echo "   ACTION: For each flagged file, ask:"
    echo "   'What if the user already has data when they arrive?'"
  fi
fi
