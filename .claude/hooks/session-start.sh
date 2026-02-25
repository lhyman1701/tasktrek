#!/bin/bash
# SessionStart hook: Injects session context into Claude
# Shows wave status and current task context

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    SESSION INITIALIZED                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Show wave status if config exists
if [ -f ".wave-config.json" ]; then
    ACTIVE_WAVE=$(python3 -c "
import json
try:
    with open('.wave-config.json') as f:
        data = json.load(f)
    wave = data.get('current_state', {}).get('active_wave')
    if wave:
        print(f'Active Wave: {wave}')
    else:
        print('No active wave')
except:
    print('Wave config error')
" 2>/dev/null)
    echo "📋 $ACTIVE_WAVE"
fi

# Show recent progress file if exists
PROGRESS_FILE=$(ls -t progress/wave-*-status.md 2>/dev/null | head -1)
if [ -n "$PROGRESS_FILE" ]; then
    echo "📄 Progress: $PROGRESS_FILE"
fi

# Show uncommitted changes count
CHANGES=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
if [ "$CHANGES" -gt 0 ]; then
    echo "⚠️  Uncommitted changes: $CHANGES files"
fi

echo ""
echo "💡 Commands: /wave-status | /next-task | /commit-work | /end-session"
echo ""

exit 0
