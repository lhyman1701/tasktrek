#!/bin/bash

# verify-condition-coverage.sh
# Verifies that all user conditions have tests
# Returns exit code 1 if conditions lack tests (blocks deployment)

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

REGISTRY_FILE="coverage-registry.yaml"
E2E_DIR="${E2E_DIR:-e2e}"

echo "============================================"
echo "User Condition Coverage Verification"
echo "============================================"
echo ""

# Check if registry file exists
if [ ! -f "$REGISTRY_FILE" ]; then
    echo "WARNING: $REGISTRY_FILE not found"
    echo "Coverage registry has not been created yet."
    echo ""
    echo "To create the registry, run:"
    echo "  1. Complete SECA analysis for each feature"
    echo "  2. Create $REGISTRY_FILE with all conditions"
    echo ""
    echo "Proceeding with annotation-based check..."
    echo ""
fi

# Count tests by condition
echo "Scanning test files for condition annotations..."
echo ""

UC_NEW_COUNT=$(grep -r "@condition UC-NEW" "$E2E_DIR" 2>/dev/null | wc -l | tr -d ' ')
UC_RET_COUNT=$(grep -r "@condition UC-RET" "$E2E_DIR" 2>/dev/null | wc -l | tr -d ' ')
UC_PARTIAL_COUNT=$(grep -r "@condition UC-PARTIAL" "$E2E_DIR" 2>/dev/null | wc -l | tr -d ' ')

echo "Test counts by condition:"
echo "  UC-NEW (New User):        $UC_NEW_COUNT tests"
echo "  UC-RET (Returning User):  $UC_RET_COUNT tests"
echo "  UC-PARTIAL (Partial):     $UC_PARTIAL_COUNT tests"
echo ""

# Find tests without condition annotation
UNANNOTATED=$(find "$E2E_DIR" -name "*.spec.ts" -exec grep -L "@condition" {} \; 2>/dev/null | wc -l | tr -d ' ')

if [ "$UNANNOTATED" -gt 0 ]; then
    echo "WARNING: $UNANNOTATED test files lack @condition annotation"
    echo "Files without annotation:"
    find "$E2E_DIR" -name "*.spec.ts" -exec grep -L "@condition" {} \; 2>/dev/null | head -10
    echo ""
fi

# Check registry if it exists
if [ -f "$REGISTRY_FILE" ]; then
    echo "Checking coverage registry..."
    echo ""

    # Check for missing conditions
    MISSING_COUNT=$(grep -c 'status: "missing"' "$REGISTRY_FILE" 2>/dev/null || echo "0")

    if [ "$MISSING_COUNT" -gt 0 ]; then
        echo "ERROR: $MISSING_COUNT conditions are missing tests!"
        echo ""
        echo "Missing conditions:"
        grep -B5 'status: "missing"' "$REGISTRY_FILE" | grep -E "(feature:|UC-)"
        echo ""
        echo "Please write tests for these conditions before merging."
        exit 1
    fi

    # Check for incomplete features
    INCOMPLETE_COUNT=$(grep -c 'coverage_complete: false' "$REGISTRY_FILE" 2>/dev/null || echo "0")

    if [ "$INCOMPLETE_COUNT" -gt 0 ]; then
        echo "ERROR: $INCOMPLETE_COUNT features have incomplete coverage!"
        echo ""
        echo "Incomplete features:"
        grep -B15 'coverage_complete: false' "$REGISTRY_FILE" | grep -E "^  [a-z]"
        echo ""
        echo "Please complete test coverage for these features."
        exit 1
    fi
fi

# Ratio check
if [ "$UC_NEW_COUNT" -gt 0 ] && [ "$UC_RET_COUNT" -eq 0 ]; then
    echo "ERROR: No UC-RET (returning user) tests found!"
    echo ""
    echo "You have $UC_NEW_COUNT tests for new users but 0 tests for returning users."
    echo "This is a critical gap - returning user scenarios are untested."
    echo ""
    echo "To fix:"
    echo "  1. Use template: .claude/templates/returning-user-test-template.md"
    echo "  2. Add @condition UC-RET annotation to tests"
    echo "  3. Ensure tests use pre-existing data (don't create data)"
    exit 1
fi

# Ratio warning
if [ "$UC_NEW_COUNT" -gt 0 ] && [ "$UC_RET_COUNT" -gt 0 ]; then
    RATIO=$(echo "scale=2; $UC_RET_COUNT / $UC_NEW_COUNT * 100" | bc 2>/dev/null || echo "0")

    if [ "$(echo "$RATIO < 50" | bc 2>/dev/null || echo "0")" -eq 1 ]; then
        echo "WARNING: UC-RET to UC-NEW ratio is low ($RATIO%)"
        echo "Consider adding more returning user tests."
        echo ""
    fi
fi

echo "============================================"
echo "Coverage Check Complete"
echo "============================================"

# Summary
if [ -f "$REGISTRY_FILE" ]; then
    echo "Registry: FOUND"
    echo "Missing conditions: 0"
else
    echo "Registry: NOT FOUND (create coverage-registry.yaml)"
fi

echo "UC-NEW tests: $UC_NEW_COUNT"
echo "UC-RET tests: $UC_RET_COUNT"
echo ""
echo "Status: PASS"
echo ""

exit 0
