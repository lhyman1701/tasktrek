#!/bin/bash
# PreToolUse hook for Write|Edit operations
# Reminds Claude to verify work is aligned with task

set -e

PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$PROJECT_ROOT"

# Source project config
. ".claude/config.sh" 2>/dev/null || true

# Only show reminder if wave system is active
if [ -f ".wave-config.json" ]; then
    ACTIVE_WAVE=$(python3 -c "
import json
try:
    with open('.wave-config.json') as f:
        data = json.load(f)
    print(data.get('current_state', {}).get('active_wave', ''))
except:
    pass
" 2>/dev/null)

    if [ -n "$ACTIVE_WAVE" ]; then
        echo "⚠️  REMINDER: Does this edit align with current wave ($ACTIVE_WAVE)?"
    fi
fi

exit 0
