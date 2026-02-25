#!/bin/bash
# SessionStart hook: Testing enforcement system
# Loads test credentials and shows test stack info

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              TESTING ENFORCEMENT SYSTEM ACTIVE              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Load test credentials if available
if [ -f ".env.test" ]; then
    echo "✅ Test credentials loaded from .env.test"
    echo ""
    echo "📋 Test credentials available (from .env.test):"
    # Show available credentials (masked)
    grep -E "^TEST_.*=" .env.test 2>/dev/null | while read line; do
        VAR_NAME=$(echo "$line" | cut -d= -f1)
        echo "   ${VAR_NAME}=***"
    done
else
    echo "⚠️  No .env.test found - test credentials not loaded"
fi

echo ""

# Show test failure tracker status
if [ -f "test-failures.json" ]; then
    STATS=$(python3 -c "
import json
try:
    with open('test-failures.json') as f:
        data = json.load(f)
    total = data.get('total', 0)
    fixed = data.get('fixed', 0)
    investigated = data.get('investigated', 0)
    print(f'{fixed}/{total} fixed, {investigated}/{total} investigated')
except:
    print('0/0 fixed, 0/0 investigated')
" 2>/dev/null)
    echo "📊 Test failure tracker: $STATS"
fi

# Show test baseline status
if [ -f ".test-baseline.json" ]; then
    BASELINE_COMMIT=$(python3 -c "
import json
try:
    with open('.test-baseline.json') as f:
        print(json.load(f).get('commit_sha', 'unknown')[:7])
except:
    print('unknown')
" 2>/dev/null)
    echo "📊 Test baseline active (commit $BASELINE_COMMIT) — regressions will be caught"
fi

echo ""

# Show test stack from config
if [ -n "${TEST_COMMAND:-}" ]; then
    echo "🧪 TEST COMMAND: $TEST_COMMAND"
fi
if [ -n "${E2E_COMMAND:-}" ]; then
    echo "🧪 E2E COMMAND: $E2E_COMMAND"
fi

echo ""
echo "🔧 DIAGNOSTIC TOOLS — use ALL of these before asking the human:"
echo "   • Logs:     tail -100 logs/*.log | docker logs <container>"
echo "   • Database: MCP server or psql/mongosh directly"
echo "   • Git:      git log --oneline -20 | git diff | git blame <file>"
echo "   • Services: docker ps | lsof -i :PORT"
echo "   • Network:  curl -v http://localhost:PORT/health"
echo "   • Config:   .env files, docker-compose.yml"
echo ""
echo "📌 PROTOCOL: Classify every failure (A=app bug, B=test bug, C=env) BEFORE fixing"
echo "📌 COMMANDS: /investigate-failures  /baseline-test  /test-audit"

exit 0
