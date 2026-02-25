#!/bin/bash
# Verification gate for user condition coverage

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

echo "=== User Condition Coverage Verification ==="
echo ""

# Check for enumeration file
if [ ! -f ".claude/current-enumeration.md" ]; then
  echo "❌ BLOCKED: No enumeration found"
  echo "   Run /test-enumerate first"
  exit 1
fi

echo "Checking enumeration..."

# Verify required user conditions are enumerated
NEW_USER=$(grep -ciE "new.?user|UC-NEW|empty|no.?data" .claude/current-enumeration.md)
RETURNING_USER=$(grep -ciE "returning|UC-RET|existing|has.?data" .claude/current-enumeration.md)

if [ "$NEW_USER" -eq 0 ]; then
  echo "❌ Missing: 'New user' condition not enumerated"
  exit 1
fi

if [ "$RETURNING_USER" -eq 0 ]; then
  echo "❌ Missing: 'Returning user' condition not enumerated"
  echo "   You MUST enumerate the 'returning user with existing data' condition"
  exit 1
fi

echo "✓ 'New user' condition enumerated"
echo "✓ 'Returning user' condition enumerated"

# Check coverage confirmation
CONFIRMED=$(grep -c "\[x\]\|✓\|YES" .claude/current-enumeration.md)
if [ "$CONFIRMED" -lt 4 ]; then
  echo "❌ Coverage confirmation incomplete"
  echo "   Complete all checkboxes in enumeration before implementing"
  exit 1
fi

echo "✓ Coverage confirmed"
echo ""
echo "=== Verification PASSED ==="
echo "You may proceed with implementation."
