# Implementation Plan: Fix Agent Task Pickup Issue

## Context

**Problem:** When tasks are assigned to agents in Mission Control, agents do not automatically discover and start working on them. Specifically, Bond was assigned a task 3 hours ago, has sent multiple heartbeats since then, but the task remains in the "ASSIGNED" column instead of moving to "IN PROGRESS".

**Root Causes Identified:**

1. **Primary Issue - Notification Delivery Broken:** The notification poller service on the OpenClaw server has been failing for 12+ hours with "Gateway not connected" errors, preventing push notifications from reaching agents.

2. **Secondary Issue - No Fallback Polling:** Agent heartbeats only update timestamps—they don't actively check for assigned tasks. The system has no "pull" mechanism as a backup.

3. **Missing Convex Query:** No dedicated query exists for agents to discover their assigned tasks (`getMyTasks`).

4. **Documentation Gap:** HEARTBEAT.md files contain checklists for Claude to read, but no executable commands to actually poll for tasks.

**Why This Matters:** The system was designed with a push-based notification architecture, but has no redundancy. When the notification poller fails, agents become blind to new assignments. This creates a single point of failure.

**Intended Outcome:** Implement a defense-in-depth approach where agents actively poll for tasks during heartbeats (primary), with push notifications as a secondary real-time alert mechanism.

---

## Recommended Approach

Implement a **pull-based primary + push-based secondary** architecture:

- **Primary (Pull):** Agent heartbeats actively query Convex for assigned tasks every 15 minutes
- **Secondary (Push):** Fix notification poller for real-time alerts (bonus, but not critical)

This ensures agents discover work even when the notification system fails.

---

## Implementation Steps

### Step 1: Add Convex Query for Task Discovery

**File:** `convex/tasks.ts`

**Add new query function:**

```typescript
// Get tasks assigned to a specific agent
export const getMyTasks = query({
  args: {
    agentId: v.id("agents"),
    statuses: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const statuses = args.statuses || ["assigned", "in_progress"];

    // Query all tasks and filter for this agent
    const allTasks = await ctx.db.query("tasks").collect();
    const myTasks = allTasks.filter(task =>
      task.assigneeIds.includes(args.agentId) &&
      statuses.includes(task.status)
    );

    // Populate assignee details
    return Promise.all(
      myTasks.map(async (task) => ({
        ...task,
        assignees: await Promise.all(
          task.assigneeIds.map((id) => ctx.db.get(id))
        ),
      }))
    );
  }
});
```

**Why:** Provides agents a dedicated API to discover their assigned work, avoiding the need to fetch all tasks and manually filter.

**Reuse Pattern:** Follows the same pattern as existing `tasks.list()` query (lines 108-121 in convex/tasks.ts).

---

### Step 2: Deploy Convex Changes

**Commands:**

```bash
cd /Users/mac/dev/mission-control-ui

# Push schema changes to production
npx convex deploy --prod

# Test the new query with Bond's agent ID
npx convex run --prod tasks:getMyTasks \
  '{"agentId":"j97a2z98zwgrnr1cnp6wjn8dps80rmv2"}'
```

**Expected Output:** JSON array containing Bond's 2 assigned tasks.

---

### Step 3: Update Agent HEARTBEAT.md Files (Server-Side)

**SSH into server:**

```bash
ssh akaniyenemichael01@100.118.28.4
```

**File 1:** `~/.openclaw/agents/bond/agent/HEARTBEAT.md`

**Update Section 2 (Check for assigned tasks):**

```markdown
### 2. Check for assigned tasks

**Run this command:**
```bash
cd ~/.openclaw/mission-control
npx convex run --prod tasks:getMyTasks \
  '{"agentId":"j97a2z98zwgrnr1cnp6wjn8dps80rmv2"}'
```

**If tasks are found:**
1. Read the task details (title, description, priority)
2. Update task status to "in_progress":
   ```bash
   npx convex run --prod tasks:updateStatus \
     '{"taskId":"<TASK_ID>","status":"in_progress"}'
   ```
3. Update your own status to "active":
   ```bash
   npx convex run --prod agents:updateHeartbeat \
     '{"sessionKey":"agent:bond:main","status":"active","currentTaskId":"<TASK_ID>"}'
   ```
4. Begin working on the task immediately
5. Post progress updates to the task thread

**If no tasks found:**
Continue to next heartbeat item
```

**File 2:** `~/.openclaw/agents/main/agent/HEARTBEAT.md`

**Update Section 2 with Kai's agent ID:**

```bash
npx convex run --prod tasks:getMyTasks \
  '{"agentId":"j97f6bwdt31r23n2txj4nfzx9s80rfgb"}'
```

(Same structure as Bond's, but with Kai's ID)

**Why:** Makes HEARTBEAT.md actionable—Claude can execute these commands directly rather than just reading a checklist.

---

### Step 4: Create Agent SDK Helper Script (Optional Enhancement)

**File:** `~/.openclaw/bin/mission-control-sdk.sh` (new file on server)

```bash
#!/bin/bash
# Mission Control Agent SDK
# Simplifies common operations for agents

CONVEX_DIR="$HOME/.openclaw/mission-control"

case "$1" in
  "my-tasks")
    cd "$CONVEX_DIR"
    npx convex run --prod tasks:getMyTasks "{\"agentId\":\"$2\"}"
    ;;
  "my-notifications")
    cd "$CONVEX_DIR"
    npx convex run --prod notifications:getUndelivered "{\"agentId\":\"$2\"}"
    ;;
  "start-task")
    cd "$CONVEX_DIR"
    npx convex run --prod tasks:updateStatus \
      "{\"taskId\":\"$2\",\"status\":\"in_progress\"}"
    ;;
  "complete-task")
    cd "$CONVEX_DIR"
    npx convex run --prod tasks:updateStatus \
      "{\"taskId\":\"$2\",\"status\":\"done\"}"
    ;;
  "heartbeat")
    cd "$CONVEX_DIR"
    npx convex run --prod agents:updateHeartbeat \
      "{\"sessionKey\":\"$2\",\"status\":\"$3\",\"currentTaskId\":\"$4\"}"
    ;;
  *)
    echo "Usage: $0 {my-tasks|my-notifications|start-task|complete-task|heartbeat} [args]"
    exit 1
    ;;
esac
```

**Make executable:**

```bash
chmod +x ~/.openclaw/bin/mission-control-sdk.sh
```

**Usage in HEARTBEAT.md (simplified commands):**

```bash
# Instead of long npx convex commands:
~/.openclaw/bin/mission-control-sdk.sh my-tasks j97a2z98zwgrnr1cnp6wjn8dps80rmv2
~/.openclaw/bin/mission-control-sdk.sh start-task <TASK_ID>
```

**Why:** Reduces command verbosity and provides a consistent agent API.

---

### Step 5: Manually Trigger Bond to Pick Up Tasks

**Immediate fix for the stuck task:**

```bash
# SSH into server
ssh akaniyenemichael01@100.118.28.4

# Start Bond's session and trigger heartbeat
openclaw sessions start agent:bond:main --prompt \
  "HEARTBEAT: Execute your HEARTBEAT.md checklist now. Pay special attention to section 2 (check for assigned tasks). If you find tasks assigned to you, start working on them immediately by updating their status to in_progress."
```

**Expected behavior:**
1. Bond reads HEARTBEAT.md
2. Bond runs the new `getMyTasks` command
3. Bond discovers the "Competitive Intelligence Research" task
4. Bond updates task status to "in_progress"
5. Bond begins work on the task
6. Task moves from ASSIGNED column to IN PROGRESS column in UI

---

### Step 6: Fix Notification Poller (Optional, Secondary)

**Debug notification poller on server:**

```bash
ssh akaniyenemichael01@100.118.28.4

# Check poller logs
~/.nvm/versions/node/v22.22.0/bin/pm2 logs mission-control-notifications --lines 50

# Check gateway logs
~/.nvm/versions/node/v22.22.0/bin/pm2 logs openclaw-gateway --lines 50

# Test gateway WebSocket connectivity
nc -zv 127.0.0.1 18789
```

**Common fixes:**
- Restart both services: `pm2 restart openclaw-gateway mission-control-notifications`
- Check authentication tokens in notification poller script
- Verify gateway WebSocket is listening on port 18789
- Add connection retry logic to poller

**Why Optional:** With Step 1-3 implemented, agents no longer depend on the notification poller. Fixing it adds real-time responsiveness but isn't critical for core functionality.

---

## Critical Files

### Files to Modify

1. **`/Users/mac/dev/mission-control-ui/convex/tasks.ts`** (local)
   - Add `getMyTasks` query function
   - Follow pattern from existing `list()` query

2. **`~/.openclaw/agents/bond/agent/HEARTBEAT.md`** (server)
   - Update Section 2 with executable task polling commands
   - Add Bond's agent ID: `j97a2z98zwgrnr1cnp6wjn8dps80rmv2`

3. **`~/.openclaw/agents/main/agent/HEARTBEAT.md`** (server)
   - Update Section 2 with executable task polling commands
   - Add Kai's agent ID: `j97f6bwdt31r23n2txj4nfzx9s80rfgb`

4. **`~/.openclaw/bin/mission-control-sdk.sh`** (server, new file)
   - Create helper script for common agent operations
   - Optional but recommended for maintainability

### Files to Reference

- **`convex/agents.ts`** - Existing `updateHeartbeat` mutation (lines 33-72)
- **`convex/notifications.ts`** - Existing `getUndelivered` query (reference for patterns)
- **`convex/schema.ts`** - Database schema definitions (agents, tasks, notifications tables)

---

## Existing Functions to Reuse

### From `convex/tasks.ts`:

- **`tasks.updateStatus(taskId, status)`** (lines 79-105) - Used to move tasks to "in_progress"
- **`tasks.list()`** (lines 108-121) - Reference pattern for populating relations
- **`tasks.get(taskId)`** (lines 146-164) - Get full task details

### From `convex/agents.ts`:

- **`agents.updateHeartbeat({ sessionKey, status, currentTaskId })`** (lines 33-72) - Update agent status when starting work

### From `convex/notifications.ts`:

- **`notifications.getUndelivered(agentId)`** - Poll for notifications (already exists)
- **`notifications.markDelivered(notificationId)`** - Mark notifications as read

---

## Verification Steps

### Test 1: Verify Convex Query Works

```bash
cd /Users/mac/dev/mission-control-ui

# Test with Bond's agent ID
npx convex run --prod tasks:getMyTasks \
  '{"agentId":"j97a2z98zwgrnr1cnp6wjn8dps80rmv2"}'

# Expected: Returns Bond's 2 assigned tasks in JSON
```

### Test 2: Manual Task Pickup

```bash
# SSH to server and trigger Bond's heartbeat
ssh akaniyenemichael01@100.118.28.4
openclaw sessions start agent:bond:main --prompt \
  "Run your HEARTBEAT.md section 2. Check for assigned tasks and start working if found."

# Expected: Bond discovers task, updates status to "in_progress"
```

### Test 3: Verify Task Status in UI

Open browser to: https://mission-control-ui-liard.vercel.app/

**Expected:**
- "Competitive Intelligence Research" task moves from ASSIGNED column to IN PROGRESS column
- Bond's status indicator changes to "WORKING" (colored dot)
- Bond's current task shows the task title
- Live Feed shows "Task status changed to in_progress" activity

### Test 4: Verify Agent Status Update

```bash
# Query Bond's agent record
cd /Users/mac/dev/mission-control-ui
npx convex run --prod agents:list

# Expected: Bond's record shows:
# - status: "active"
# - currentTaskId: (the task ID)
# - lastHeartbeat: (recent timestamp)
```

### Test 5: Monitor Next Automatic Heartbeat

```bash
# Wait for next cron heartbeat (15 minutes)
ssh akaniyenemichael01@100.118.28.4
tail -f ~/.openclaw/cron/bond-heartbeat.log

# Expected: Bond automatically checks for tasks via getMyTasks query
```

---

## Success Criteria

✅ **Immediate:**
- Bond picks up the assigned task from 3 hours ago
- Task moves to "IN PROGRESS" column in UI
- Bond begins working on the task

✅ **Short-term (next heartbeat cycle):**
- Agents automatically discover new assignments during heartbeat
- Tasks transition from ASSIGNED → IN PROGRESS within 15 minutes

✅ **Long-term:**
- System is resilient to notification poller failures
- All future task assignments are picked up by agents
- Works consistently for Kai, Bond, and any new agents

---

## Rollback Plan

If issues arise during implementation:

1. **Revert Convex deployment:**
   ```bash
   cd /Users/mac/dev/mission-control-ui
   git revert HEAD
   npx convex deploy --prod
   ```

2. **Restore original HEARTBEAT.md files:**
   ```bash
   ssh akaniyenemichael01@100.118.28.4
   git -C ~/.openclaw/agents/bond/agent/ checkout HEARTBEAT.md
   git -C ~/.openclaw/agents/main/agent/ checkout HEARTBEAT.md
   ```

3. **Remove SDK script:**
   ```bash
   rm ~/.openclaw/bin/mission-control-sdk.sh
   ```

---

## Future Enhancements

1. **Dedicated Task Checker Cron:** Run every 5 minutes (more frequent than heartbeat) for faster task pickup

2. **Agent Onboarding Template:** Standardize setup for all current and future agents

3. **Convex Real-time Subscriptions:** Replace polling with WebSocket subscriptions for instant notifications

4. **Task Assignment Algorithm:** Auto-assign tasks to idle agents based on role/capability matching

---

## Time Estimate

- **Step 1-2 (Convex changes):** 15 minutes
- **Step 3 (Update HEARTBEAT.md):** 20 minutes (both agents)
- **Step 4 (SDK script):** 15 minutes (optional)
- **Step 5 (Manual trigger):** 5 minutes
- **Step 6 (Fix poller):** 30-60 minutes (optional)
- **Verification:** 15 minutes

**Total:** ~1.5 hours for core fix (Steps 1-5), +1 hour for optional enhancements
