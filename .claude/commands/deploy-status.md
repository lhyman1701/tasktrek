---
allowed-tools: Bash, Read
description: Display comprehensive deployment status including health checks
---
# Deploy Status

Display comprehensive real-time status of the deployment.

## Configuration

Configure these in `.claude/config.sh`:

```bash
# Deployment Status Configuration
DEPLOY_URL="https://your-app.com"
HEALTH_ENDPOINT="/api/health"
STATUS_COMMAND=""  # Optional: custom status command
```

---

## Step 1: Load Configuration

```bash
# Source config
. ".claude/config.sh" 2>/dev/null || true

echo "Checking deployment status..."
echo "URL: ${DEPLOY_URL:-Not configured}"
```

---

## Step 2: Git Status

```bash
echo "Git Status"
echo "----------"
echo "Branch: $(git branch --show-current)"
echo "Commit: $(git rev-parse --short HEAD)"
echo "Message: $(git log -1 --format=%s)"
echo ""

# Check if ahead/behind remote
git fetch origin main --quiet 2>/dev/null
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
echo "Local vs Remote: $AHEAD ahead, $BEHIND behind"
```

---

## Step 3: Health Endpoint Checks

Check each endpoint and record HTTP status code:

```bash
# Source config
. ".claude/config.sh" 2>/dev/null || true

if [ -n "$DEPLOY_URL" ]; then
    echo ""
    echo "Health Endpoints"
    echo "----------------"

    # Main health check
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${DEPLOY_URL}${HEALTH_ENDPOINT:-/health}" 2>/dev/null || echo "TIMEOUT")
    echo "${DEPLOY_URL}${HEALTH_ENDPOINT:-/health} -> $STATUS"

    # Root check
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${DEPLOY_URL}/" 2>/dev/null || echo "TIMEOUT")
    echo "${DEPLOY_URL}/ -> $STATUS"
else
    echo "DEPLOY_URL not configured in .claude/config.sh"
fi
```

### Status mapping:
- `200` -> "200 OK" (healthy)
- `401`, `403` -> "<code> (Auth Required)"
- `500`, `502`, `503` -> "<code> (Error)"
- Timeout -> "Timeout"
- Connection refused -> "Unreachable"

---

## Step 4: Custom Status Command (Optional)

If a custom status command is configured:

```bash
# Source config
. ".claude/config.sh" 2>/dev/null || true

if [ -n "$STATUS_COMMAND" ]; then
    echo ""
    echo "Custom Status"
    echo "-------------"
    eval "$STATUS_COMMAND"
fi
```

---

## Final Output Template

```
================================================================================
                        DEPLOYMENT STATUS
================================================================================

Git Status
----------
Branch: main
Commit: abc1234
Message: feat: add new feature
Local vs Remote: 0 ahead, 0 behind

================================================================================

Health Endpoints
----------------
Endpoint                                        Status
--------------------------------------------------------------------------------
https://your-app.com/health                     200 OK
https://your-app.com/                           200 OK

================================================================================
```

---

## Error Handling

### URL not configured
```
DEPLOY_URL not configured. Add to .claude/config.sh:
  DEPLOY_URL="https://your-app.com"
```

### Connection refused
```
Could not connect to ${DEPLOY_URL}
- Check if the service is running
- Verify the URL is correct
- Check firewall/network settings
```

### Timeout
```
Request timed out after 10 seconds
- Service may be slow to respond
- Check service logs
- Verify endpoint is correct
```

---

## Quick Refresh

After displaying full status, suggest:
```
Re-run /deploy-status to refresh.
```
