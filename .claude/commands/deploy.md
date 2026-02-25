---
allowed-tools: Bash, Read
description: Deploy latest code to the configured environment
---
# Deploy

Deploy the current code to the configured environment.

## Configuration

Configure these in `.claude/config.sh`:

```bash
# Deployment Configuration
DEPLOY_COMMAND="npm run deploy"      # Or: git push heroku main, aws deploy, etc.
DEPLOY_URL="https://your-app.com"    # Target URL for health checks
HEALTH_ENDPOINT="/api/health"        # Health check endpoint
```

---

## Step 1: Pre-flight Checks

Run ALL of these checks. If ANY fail, STOP and report the failure.

### 1.1 Check for uncommitted changes

```bash
git status --porcelain
```

If output is NOT empty:
- Print: `Uncommitted changes detected. Commit or stash changes first.`
- List the uncommitted files
- STOP - do not proceed with deployment

### 1.2 Check current branch

```bash
git branch --show-current
```

If branch is NOT `main`:
- Print: `Not on main branch. Switch to main before deploying.`
- Print current branch name
- STOP - do not proceed with deployment

### 1.3 Check if local is ahead of remote

```bash
git fetch origin main --quiet
git rev-list --count origin/main..HEAD
```

Store the count - if > 0, we need to push before deploying.

---

## Step 2: Pre-flight Summary

Print the pre-flight status:

```
Deploy - Pre-flight Checks
---------------------------
Git status: clean (no uncommitted changes)
Branch: main
Remote: [up to date | X commits ahead]
```

---

## Step 3: Push if Needed

If local is ahead of remote (count > 0):

```bash
git push origin main
```

Print: `Pushed X commit(s) to origin/main`

---

## Step 4: Execute Deployment

Get the current commit for reference:

```bash
COMMIT_SHA=$(git rev-parse --short HEAD)
COMMIT_MSG=$(git log -1 --format=%s)
echo "Deploying commit: $COMMIT_SHA \"$COMMIT_MSG\""
```

Run the deployment:

```bash
# Source config
. ".claude/config.sh" 2>/dev/null || true

# Execute deployment
${DEPLOY_COMMAND:-echo "No DEPLOY_COMMAND configured in .claude/config.sh"}
```

---

## Step 5: Post-Deployment Verification

Once deployment completes:

### 5.1 Wait for services to stabilize

```bash
echo "Waiting 30 seconds for services to stabilize..."
sleep 30
```

### 5.2 Health check

```bash
# Source config
. ".claude/config.sh" 2>/dev/null || true

curl -s -o /dev/null -w "%{http_code}" "${DEPLOY_URL}${HEALTH_ENDPOINT:-/health}"
```

Expected: `200`

---

## Step 6: Success Summary

```
Deployment Successful!
----------------------
Commit: <sha> "<commit message>"
URL: ${DEPLOY_URL}
Health: All services responding
```

---

## Step 7: Handle Failure

If any step fails:

```
Deployment Failed
-----------------
Failed Step: <step-name>

Error Output:
<error output>

Next Steps:
1. Review the error above
2. Fix the issue locally
3. Commit and run /deploy again
```

---

## Troubleshooting

### Deployment command not configured
Add `DEPLOY_COMMAND` to `.claude/config.sh`:
```bash
# Examples:
DEPLOY_COMMAND="git push heroku main"
DEPLOY_COMMAND="vercel --prod"
DEPLOY_COMMAND="aws deploy"
DEPLOY_COMMAND="npm run deploy"
```

### Health check fails
1. Wait another 60 seconds for cold starts
2. Check application logs
3. Verify environment variables are set
