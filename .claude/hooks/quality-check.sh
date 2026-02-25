#!/bin/bash
# Quality metrics quick check - surfaces quality warnings during sessions
#
# This hook can be called periodically or after significant changes
# to surface quality metrics and potential issues.

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Quick E2E quality check (assertion density)
check_e2e_quality() {
    local e2e_dir="${E2E_DIR:-e2e}"
    if [ ! -d "$e2e_dir" ]; then
        return
    fi

    local total_tests=0
    local total_assertions=0
    local visibility_only=0

    for file in $(find "$e2e_dir" -name "*.spec.ts" 2>/dev/null | head -20); do
        tests=$(grep -c "test\('" "$file" 2>/dev/null || echo 0)
        assertions=$(grep -c "expect\|assert" "$file" 2>/dev/null || echo 0)
        visibility=$(grep -c "toBeVisible()" "$file" 2>/dev/null || echo 0)

        total_tests=$((total_tests + tests))
        total_assertions=$((total_assertions + assertions))
        visibility_only=$((visibility_only + visibility))
    done

    if [ "$total_tests" -gt 0 ]; then
        density=$((total_assertions / total_tests))
        content_pct=0
        if [ "$total_assertions" -gt 0 ]; then
            content_pct=$(( (total_assertions - visibility_only) * 100 / total_assertions ))
        fi

        if [ "$density" -lt 2 ] || [ "$content_pct" -lt 70 ]; then
            echo "⚠️  E2E Quality: ${density} assertions/test (target: 2+), ${content_pct}% content checks (target: 70%+)"
        fi
    fi
}

# Quick lint check (errors only)
check_lint_errors() {
    if [ -n "${LINT_COMMAND:-}" ]; then
        # Quick lint check - just count errors
        errors=$(eval "$LINT_COMMAND --quiet --format json" 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(sum(f.get('errorCount', 0) for f in data))
except:
    print(0)
" 2>/dev/null || echo "0")

        if [ "$errors" -gt 0 ]; then
            echo "⚠️  Lint: $errors errors found"
        fi
    fi
}

# Check for uncommitted test changes
check_test_coverage() {
    # Check if tests were modified but not run
    local modified_tests=$(git diff --name-only HEAD 2>/dev/null | grep -E '\.(test|spec)\.(ts|tsx|py)$' | wc -l | tr -d ' ')
    if [ "$modified_tests" -gt 0 ]; then
        echo "📋 Note: $modified_tests test file(s) modified - consider running tests"
    fi
}

# Main output
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 QUALITY CHECK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_e2e_quality
check_lint_errors
check_test_coverage

# If no warnings printed, show success
if [ -z "$(check_e2e_quality 2>&1)" ] && [ -z "$(check_lint_errors 2>&1)" ]; then
    echo "✅ Quality checks passing"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
